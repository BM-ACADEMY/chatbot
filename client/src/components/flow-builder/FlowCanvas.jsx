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
import axios from 'axios';

const nodeTypes = {
    custom: CustomNode,
};

const FlowCanvasInner = ({ flowId, steps, onStepsChange, token, onSelectNode }) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const { screenToFlowPosition, fitView } = useReactFlow();
    const isInitialLayoutDone = useRef(false);

    // --- CONVERT STEPS TO NODES & EDGES ---
    useEffect(() => {
        const newNodes = steps.map((step, idx) => ({
            id: step._id,
            type: 'custom',
            position: step.position || { x: idx * 300, y: 100 },
            data: { ...step },
        }));

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
                            animated: true,
                            style: { stroke: '#3b82f6', strokeWidth: 2 },
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
                         animated: true,
                         style: { stroke: '#3b82f6', strokeWidth: 2 },
                     });
                 }
            }
        });

        setNodes(newNodes);
        setEdges(newEdges);

        // Auto-fit on first load
        if (!isInitialLayoutDone.current && steps.length > 0) {
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

    const onConnect = useCallback(
        (params) => {
            const { source, target, sourceHandle } = params;
            // Update the local step data to reflect the new nextStep
            const sourceStep = steps.find(s => s._id === source);
            const targetStep = steps.find(s => s._id === target);
            
            if (sourceStep && targetStep && sourceHandle) {
                const isOptionHandle = sourceHandle.startsWith('handle-');
                const optIndex = isOptionHandle ? parseInt(sourceHandle.replace('handle-', '')) : null;

                if (sourceStep.options && sourceStep.options.length > 0) {
                    // It's a button node
                    if (isOptionHandle && sourceStep.options[optIndex]) {
                        const updatedOptions = [...sourceStep.options];
                        updatedOptions[optIndex].nextStep = targetStep.stepId;
                        onStepsChange(source, { options: updatedOptions });
                    }
                } else {
                    // It's an open response node
                    onStepsChange(source, { nextStep: targetStep.stepId });
                }
            }

            setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds));
        },
        [steps, onStepsChange]
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
            } catch (err) {
                console.error("Failed to create step", err);
            }
        },
        [screenToFlowPosition, flowId, token]
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
                fitView
                className="bg-dot-pattern"
                snapToGrid={true}
                snapGrid={[15, 15]}
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
