import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import UserChat from './UserChat';
import FlowCanvas from './flow-builder/FlowCanvas';
import FlowSidebar from './flow-builder/FlowSidebar';
import { 
    Trash2, Save, Network, ArrowLeft, Play, X, Bot, 
    Layers, Zap, Edit3, Tag, UserCheck, Clock, Settings2,
    ChevronRight, ExternalLink
} from 'lucide-react';

const FlowBuilder = ({ flowId, onBack }) => {
    const { user } = useContext(AuthContext);
    const [steps, setSteps] = useState([]);
    const [selectedStep, setSelectedStep] = useState(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState('steps'); 
    const [followups, setFollowups] = useState([]);
    const [flowMetadata, setFlowMetadata] = useState(null);
    const [specialties, setSpecialties] = useState([]);
    
    // UI STATES FOR WORKSPACE EFFICIENCY
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const fetchSteps = useCallback(async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/flow?flowId=${flowId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSteps(data);
        } catch (err) {
            console.error(err);
        }
    }, [flowId, user.token]);

    const fetchFollowups = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/flow/followups/${flowId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFollowups(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMetadata = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/flow-mgmt/${flowId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFlowMetadata(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSpecialties = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/specialties`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSpecialties(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchSteps();
        fetchFollowups();
        fetchMetadata();
        fetchSpecialties();
    }, [user.token, flowId, fetchSteps]);

    const handleSaveStep = async (stepData) => {
        const id = stepData._id;
        try {
            const { data } = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/flow/${id}`, stepData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            // Update local state without full refresh if possible
            setSteps(prev => prev.map(s => s._id === id ? data : s));
            if (selectedStep?._id === id) setSelectedStep(data);
            
            // Auto open config when a node is selected if it was closed
            if (selectedStep?._id !== id) setIsConfigOpen(true);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteStep = async (id) => {
        if (!window.confirm('Delete this neural block?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/flow/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSelectedStep(null);
            fetchSteps();
        } catch (err) {
            console.error(err);
        }
    };

    const addOption = () => {
        if (!selectedStep) return;
        const updated = { ...selectedStep, options: [...selectedStep.options, { label: 'New Option', nextStep: '' }] };
        handleSaveStep(updated);
    };

    return (
        <div className="h-full overflow-hidden flex flex-col bg-gray-950 font-sans">
            {/* TOP BAR / TOOLBAR */}
            <header className="h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800 z-50 shadow-2xl">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="h-6 w-px bg-gray-800"></div>
                    <div>
                        <h1 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                           {flowMetadata?.name || 'Neural Path Designer'}
                           <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <div className="hidden lg:flex bg-gray-800/50 p-1 rounded-xl border border-gray-800 mr-2 md:mr-4">
                        <button 
                            onClick={() => setActiveSubTab('steps')}
                            className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${activeSubTab === 'steps' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Journey Nodes
                        </button>
                        <button 
                            onClick={() => setActiveSubTab('followups')}
                            className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${activeSubTab === 'followups' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Automations
                        </button>
                    </div>

                    <div className="flex bg-gray-800/30 p-1 rounded-xl border border-gray-800 mr-2">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-1.5 rounded-lg transition-all ${isSidebarOpen ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
                            title="Toggle Blocks Sidebar"
                        >
                            <Layers size={14} />
                        </button>
                        <button 
                            onClick={() => setIsConfigOpen(!isConfigOpen)}
                            className={`p-1.5 rounded-lg transition-all ${isConfigOpen ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                            title="Toggle Property Editor"
                        >
                            <Settings2 size={14} />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsPreviewing(true)}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all border border-gray-700"
                    >
                        <Play size={14} fill="gray" className="hidden sm:inline" /> Preview
                    </button>
                    <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-black shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                        Publish
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {activeSubTab === 'steps' ? (
                    <>
                        {/* LEFT SIDEBAR: BLOCKS */}
                        <div className={`transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'w-[320px]' : 'w-0'}`}>
                            <FlowSidebar />
                        </div>

                        {/* CENTER CANVAS */}
                        <FlowCanvas 
                            flowId={flowId}
                            steps={steps} 
                            onStepsChange={(id, data) => handleSaveStep({ ...steps.find(s => s._id === id), ...data })}
                            token={user.token}
                            onSelectNode={(nodeData) => {
                                setSelectedStep(nodeData);
                                setIsConfigOpen(true);
                            }}
                        />

                        {/* RIGHT SIDEBAR: PROPERTIES */}
                        <div className={`transition-all duration-300 overflow-hidden bg-gray-950 border-l border-gray-800 shadow-2xl relative z-20 ${isConfigOpen ? 'w-[380px]' : 'w-0'}`}>
                            {selectedStep ? (
                                <aside className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
                                <header className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                            <Settings2 size={18} className="text-blue-500" />
                                        </div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Neural Config</h3>
                                    </div>
                                    <button onClick={() => setSelectedStep(null)} className="text-gray-500 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </header>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                    {/* CORE IDENTIFIER */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Block Route Key</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={selectedStep.stepId}
                                                    onChange={(e) => handleSaveStep({ ...selectedStep, stepId: e.target.value })}
                                                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono shadow-inner"
                                                />
                                                <button onClick={() => deleteStep(selectedStep._id)} className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Neural Output (Question)</label>
                                            <textarea 
                                                rows="4"
                                                value={selectedStep.question}
                                                onChange={(e) => handleSaveStep({ ...selectedStep, question: e.target.value })}
                                                placeholder="Enter message text here..."
                                                className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    {/* DATA EXTRACTION / CRM MAPPING */}
                                    <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-4">
                                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={14} /> Extraction Logic
                                        </h4>
                                        <div>
                                            <label className="block text-[9px] font-bold text-gray-600 uppercase mb-2 ml-1">Sync to CRM Attribute</label>
                                            <input 
                                                type="text"
                                                placeholder="e.g. lead_address"
                                                value={selectedStep.captureMapping || ''}
                                                onChange={(e) => handleSaveStep({ ...selectedStep, captureMapping: e.target.value })}
                                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            {['text', 'file'].map(type => (
                                                <button 
                                                    key={type}
                                                    onClick={() => handleSaveStep({ ...selectedStep, captureType: type })}
                                                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${selectedStep.captureType === type ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    {type === 'text' ? 'String/Input' : 'Binary/File'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ROUTING BUTTONS */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Visual Ports (Buttons)</h4>
                                            <button 
                                                onClick={addOption}
                                                className="text-[9px] font-black text-blue-400 bg-blue-500/5 hover:bg-blue-500/20 px-3 py-1 rounded-lg border border-blue-500/20 transition-all"
                                            >
                                                + ADD PORT
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {selectedStep.options.map((opt, i) => (
                                                <div key={i} className="group relative bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-col gap-3 hover:border-gray-700 transition-all shadow-inner">
                                                    <div className="flex gap-2 items-center">
                                                        <input 
                                                            value={opt.label}
                                                            onChange={(e) => {
                                                                const opts = [...selectedStep.options];
                                                                opts[i].label = e.target.value;
                                                                handleSaveStep({ ...selectedStep, options: opts });
                                                            }}
                                                            className="flex-1 bg-transparent border-none text-[11px] font-bold text-white focus:ring-0 p-0"
                                                            placeholder="Button Label"
                                                        />
                                                        <button 
                                                            onClick={() => {
                                                                const opts = selectedStep.options.filter((_, idx) => idx !== i);
                                                                handleSaveStep({ ...selectedStep, options: opts });
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 p-1 transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                                                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Connect ID:</span>
                                                        <span className="text-[10px] font-mono text-blue-400 font-bold">{opt.nextStep || 'Unlinked'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ADVANCED ROUTING */}
                                    <div className="space-y-4 pt-4 border-t border-gray-800">
                                         <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Auto-Assignment</label>
                                            <select
                                                value={selectedStep.assignmentAction || ''}
                                                onChange={(e) => handleSaveStep({ ...selectedStep, assignmentAction: e.target.value })}
                                                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold appearance-none shadow-inner"
                                            >
                                                <option value="">No Assignment</option>
                                                {specialties.map(spec => (
                                                    <option key={spec} value={spec}>Route to {spec}</option>
                                                ))}
                                                <option value="closer">High Priority Closer</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        ) : (
                            <aside className="flex flex-col h-full items-center justify-center p-12 text-center">
                                <div className="w-16 h-16 bg-gray-900 rounded-[2rem] border border-gray-800 flex items-center justify-center mb-6 shadow-inner animate-pulse">
                                    <Bot size={32} className="text-gray-700" />
                                </div>
                                <h4 className="text-sm font-black text-gray-500 tracking-widest uppercase mb-2">Neural Sandbox</h4>
                                <p className="text-[10px] text-gray-600 font-medium leading-relaxed max-w-[200px]">
                                    Connect output ports to journey nodes to define your logical hierarchy.
                                </p>
                            </aside>
                        )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 bg-gray-950 p-12 overflow-y-auto custom-scrollbar">
                        {/* FOLLOW-UP UI REMAINS SIMILAR BUT STYLED TO MATCH */}
                         <div className="max-w-4xl mx-auto space-y-12 pb-24">
                            <header className="text-center">
                                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                                    <Clock size={32} className="text-purple-400" />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tighter">Automated Sequences</h2>
                                <p className="text-gray-500 mt-2 text-lg">Define re-engagement triggers for inactive neural paths.</p>
                            </header>

                            <div className="grid grid-cols-2 gap-6">
                                {[3, 12, 24, 48].map(h => {
                                    const current = followups.find(f => f.delayHours === h);
                                    return (
                                        <div 
                                            key={h}
                                            className="bg-gray-900 border border-gray-800 p-8 rounded-[3rem] hover:border-purple-500/50 transition-all group relative overflow-hidden cursor-pointer"
                                        >
                                            <span className="text-6xl font-black text-gray-800 group-hover:text-purple-500/10 transition-colors absolute -right-4 -bottom-6">{h}h</span>
                                            <div className="relative z-10">
                                                <h3 className="text-3xl font-black text-white mb-2">{h}h</h3>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Delay Trigger</p>
                                                <p className="text-sm text-gray-500 italic line-clamp-2 leading-relaxed">
                                                    {current ? `"${current.text}"` : 'Construct a re-engagement payload...'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PREVIEW MODAL */}
            {isPreviewing && (
                 <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
                    <div className="relative flex flex-col md:flex-row gap-12 items-center max-w-6xl w-full">
                        <button 
                            onClick={() => setIsPreviewing(false)} 
                            className="absolute -top-12 right-0 text-gray-500 hover:text-white transition-all flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"
                        >
                            Exit Sandbox <X size={20} />
                        </button>
                        
                        {/* Phone Frame */}
                        <div className="relative w-[340px] h-[680px] bg-black rounded-[3.5rem] border-[10px] border-gray-800 shadow-[0_0_120px_rgba(59,130,246,0.25)] overflow-hidden shrink-0 animate-in zoom-in-95 duration-500">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-800 rounded-b-[1.5rem] z-50"></div>
                             <div className="h-full">
                                <UserChat isEmbedded={true} previewFlowId={flowId} />
                            </div>
                        </div>

                        {/* Preview Context */}
                        <div className="flex-1 space-y-8 animate-in slide-in-from-right-12 duration-500">
                            <div>
                                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-blue-500/30">
                                    <Zap size={32} className="text-blue-400" />
                                </div>
                                <h3 className="text-4xl font-black text-white tracking-tighter leading-tight">Neural Path Sandbox</h3>
                                <p className="text-xl text-gray-500 leading-relaxed mt-4">
                                    Interact with your logic in a secure, isolated container. Every node, connection, and CRM trigger is simulated in real-time.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-900 border border-gray-800 rounded-3xl">
                                    <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</h5>
                                    <p className="text-emerald-400 font-bold">Simulator Active</p>
                                </div>
                                <div className="p-4 bg-gray-900 border border-gray-800 rounded-3xl">
                                    <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Persistence</h5>
                                    <p className="text-blue-400 font-bold">Ephemeral Mode</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 shadow-2xl">
                                    View Logic Trace
                                </button>
                                <button className="flex items-center justify-center p-4 bg-gray-800 text-gray-400 rounded-2xl hover:text-white transition-all">
                                    <ExternalLink size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default FlowBuilder;
