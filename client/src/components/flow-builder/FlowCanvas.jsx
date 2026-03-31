import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
    ReactFlow, 
    Controls, 
    Background, 
    applyEdgeChanges, 
    applyNodeChanges, 
    addEdge,
    useReactFlow,
    ReactFlowProvider,
    Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import axios from 'axios';

const nodeTypes = {
    custom: CustomNode,
};

const edgeTypes = {
    custom: CustomEdge,
};

const FlowCanvasInner = ({ flowId, steps, onStepsChange, token, onSelectNode, onStepCreated }) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const { screenToFlowPosition, fitView } = useReactFlow();
    const isInitialLayoutDone = useRef(false);
    const edgesInitialized = useRef(false);
    const stepsRef = useRef(steps);

    useEffect(() => {
        stepsRef.current = steps;
    }, [steps]);

    // --- CONVERT STEPS TO NODES & EDGES ---
    useEffect(() => {
        if (!steps || steps.length === 0) return;

        // --- DETERMINE ROOT NODE DYNAMICALLY ---
        const explicitStart = steps.find(step => step.isEntryPoint);
        let startStepId = null;

        if (explicitStart) {
            startStepId = explicitStart.stepId;
        } else {
            const targetIds = new Set();
            steps.forEach(step => {
                if (step.nextStep) targetIds.add(step.nextStep);
                if (step.options && step.options.length > 0) {
                    step.options.forEach(opt => {
                        if (opt.nextStep) targetIds.add(opt.nextStep);
                    });
                }
            });

            const rootNodes = steps.filter(step => !targetIds.has(step.stepId));
            if (rootNodes.length > 0) {
                const sortedRoots = [...rootNodes].sort((a, b) => {
                    if (a.position?.x !== b.position?.x) return (a.position?.x || 0) - (b.position?.x || 0);
                    return (a.position?.y || 0) - (b.position?.y || 0);
                });
                startStepId = sortedRoots[0].stepId;
            } else {
                const sorted = [...steps].sort((a, b) => {
                    if (a.position?.x !== b.position?.x) return (a.position?.x || 0) - (b.position?.x || 0);
                    return (a.position?.y || 0) - (b.position?.y || 0);
                });
                startStepId = sorted[0].stepId;
            }
        }

        // Always update nodes to keep data fresh
        const newNodes = steps.map((step, idx) => ({
            id: step._id,
            type: 'custom',
            position: step.position || { x: idx * 300, y: 100 },
            data: { ...step, isStart: step.stepId === startStepId },
        }));
        setNodes(newNodes);

        // Only rebuild edges from DB on INITIAL load.
        // After that, onConnect manages edges locally so we don't
        // wipe user-drawn connections every time a step is saved.
        if (!edgesInitialized.current) {
            const newEdges = [];
            steps.forEach(step => {
                if (step.options && step.options.length > 0) {
                    step.options.forEach((opt, idx) => {
                        const target = steps.find(s => s.stepId === opt.nextStep);
                        if (target) {
                            newEdges.push({
                                id: `e-${step._id}-${target._id}-opt-${idx}`,
                                source: step._id,
                                target: target._id,
                                sourceHandle: `handle-${idx}`,
                                 targetHandle: 'target-in',
                                type: 'custom',
                                animated: true,
                                style: { stroke: '#3b82f6', strokeWidth: 2 },
                                data: { onDelete: (id) => handleDeleteEdge(id, step._id, `handle-${idx}`) }
                            });
                        }
                    });
                } else if (step.nextStep) {
                    const target = steps.find(s => s.stepId === step.nextStep);
                    if (target) {
                        newEdges.push({
                            id: `e-${step._id}-${target._id}-default`,
                            source: step._id,
                            target: target._id,
                            sourceHandle: 'handle-0',
                            targetHandle: 'target-in',
                            type: 'custom',
                            animated: true,
                            style: { stroke: '#3b82f6', strokeWidth: 2 },
                            data: { onDelete: (id) => handleDeleteEdge(id, step._id, 'handle-0') }
                        });
                    }
                }
            });
            setEdges(newEdges);
            edgesInitialized.current = true;
        }

        // Auto-fit on first load
        if (!isInitialLayoutDone.current) {
            setTimeout(() => {
                fitView({ padding: 0.2 });
                isInitialLayoutDone.current = true;
            }, 300);
        }
    }, [steps, fitView]);

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const handleDeleteEdge = useCallback(
        (edgeId, sourceId, sourceHandle) => {
            const sourceStep = stepsRef.current.find((s) => s._id === sourceId);

            if (sourceStep) {
                const effectiveHandle = sourceHandle || 'handle-0';
                const isOptionHandle = effectiveHandle.startsWith('handle-');
                const optIndex = isOptionHandle ? parseInt(effectiveHandle.replace('handle-', '')) : 0;

                if (sourceStep.options && sourceStep.options.length > 0) {
                    const updatedOptions = [...sourceStep.options];
                    if (updatedOptions[optIndex]) {
                        updatedOptions[optIndex] = { ...updatedOptions[optIndex], nextStep: '' };
                        onStepsChange(sourceId, { options: updatedOptions });
                    }
                } else {
                    onStepsChange(sourceId, { nextStep: '' });
                }
            }

            setEdges((eds) => eds.filter((e) => e.id !== edgeId));
        },
        [onStepsChange]
    );

    const onConnect = useCallback(
        (params) => {
            const { source, target, sourceHandle } = params;
            const sourceStep = steps.find(s => s._id === source);
            const targetStep = steps.find(s => s._id === target);

            if (sourceStep && targetStep) {
                const effectiveHandle = sourceHandle || 'handle-0';
                const isOptionHandle = effectiveHandle.startsWith('handle-');
                const optIndex = isOptionHandle ? parseInt(effectiveHandle.replace('handle-', '')) : 0;

                if (sourceStep.options && sourceStep.options.length > 0) {
                    // Button node — update the specific option's nextStep
                    if (sourceStep.options[optIndex] !== undefined) {
                        const updatedOptions = [...sourceStep.options];
                        updatedOptions[optIndex] = { ...updatedOptions[optIndex], nextStep: targetStep.stepId };
                        onStepsChange(source, { options: updatedOptions });
                    }
                } else {
                    // Open-response node
                    onStepsChange(source, { nextStep: targetStep.stepId });
                }
            }

            setEdges((eds) => addEdge({
                ...params,
                targetHandle: 'target-in',
                type: 'custom',
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 },
                data: { onDelete: (id) => handleDeleteEdge(id, source, sourceHandle) }
            }, eds));
        },
        [steps, onStepsChange, handleDeleteEdge]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        async (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const rawDefaults = event.dataTransfer.getData('application/reactflow-defaults');
            const defaults = rawDefaults ? JSON.parse(rawDefaults) : {};

            if (!type) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Create new step via parent prop
            const newStepId = `step_${Date.now()}`;
            const payload = {
                ...defaults,
                stepId: newStepId,
                flowId,
                position
            };

            try {
                const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/flow`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // The parent will re-fetch steps, and useEffect will update nodes
                if (onStepCreated) {
                    onStepCreated(data);
                }
            } catch (err) {
                console.error("Failed to create step", err);
            }
        },
        [screenToFlowPosition, flowId, token, onStepCreated]
    );

    const onNodeDragStop = useCallback(
        async (event, node) => {
            // Persist position change
            try {
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/flow/${node.id}`, {
                    position: node.position
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Failed to save node position", err);
            }
        },
        [token]
    );

    const onNodeClick = useCallback((event, node) => {
        onSelectNode(node.data);
    }, [onSelectNode]);

    return (
        <div className="flex-1 h-full bg-gray-950 relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeDragStop={onNodeDragStop}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="bg-dot-pattern"
                snapToGrid={true}
                snapGrid={[15, 15]}
                connectionRadius={120}
                defaultEdgeOptions={{ 
                    type: 'custom', 
                    animated: true, 
                    style: { stroke: '#3b82f6', strokeWidth: 2 },
                    data: { onDelete: (id, sId, h) => handleDeleteEdge(id, sId, h) }
                }}
            >
                <Background color="#1e293b" gap={20} size={1} />
                <Controls className="bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl p-1 flex flex-col gap-1" />
                
                <Panel position="top-right" className="flex gap-2">
                    <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 p-1 rounded-xl flex items-center gap-1 shadow-2xl">
                         <button 
                            onClick={() => fitView()}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Fit Journey
                        </button>
                    </div>
                </Panel>
            </ReactFlow>

            {/* OVERLAY FOR CANVAS STYLE */}
            <style dangerouslySetInnerHTML={{ __html: `
                .bg-dot-pattern {
                    background-image: radial-gradient(#1e293b 1px, transparent 1px);
                    background-size: 20px 20px;
                }
                .react-flow__controls-button {
                    background-color: transparent !important;
                    border: none !important;
                    border-bottom: 1px solid #1f2937 !important;
                    color: #94a3b8 !important;
                    fill: #94a3b8 !important;
                    transition: all 0.2s !important;
                }
                .react-flow__controls-button:last-child {
                    border-bottom: none !important;
                }
                .react-flow__controls-button:hover {
                    background-color: #1f2937 !important;
                    color: white !important;
                    fill: white !important;
                }
                .react-flow__controls-button svg {
                    fill: currentColor !important;
                    width: 14px !important;
                    height: 14px !important;
                }
            `}} />
        </div>
    );
};

const FlowCanvas = (props) => (
    <ReactFlowProvider>
        <FlowCanvasInner {...props} />
    </ReactFlowProvider>
);

export default FlowCanvas;
