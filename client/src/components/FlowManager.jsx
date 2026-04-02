import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { Plus, Trash2, Edit3, CheckCircle, Play, Save, X, Network } from 'lucide-react';

const FlowManager = ({ onEdit }) => {
    const { user } = useContext(AuthContext);
    const [flows, setFlows] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newFlowName, setNewFlowName] = useState('');
    const [newFlowDesc, setNewFlowDesc] = useState('');

    const fetchFlows = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/flow/mgmt`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFlows(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchFlows();
    }, [user.token]);

    const handleCreateFlow = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/flow/mgmt`, 
                { name: newFlowName, description: newFlowDesc },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setIsCreating(false);
            setNewFlowName('');
            setNewFlowDesc('');
            fetchFlows();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleStatus = async (flowId, field, value) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/flow/mgmt/${flowId}`,
                { [field]: value },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            fetchFlows();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteFlow = async (id) => {
        if (!window.confirm('Are you sure? This will delete all steps in this flow.')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/flow/mgmt/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchFlows();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto relative z-10 custom-scrollbar">
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Flow Management</h1>
                        <p className="text-gray-400 mt-1">Create and manage your conversational journeys.</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105"
                    >
                        <Plus size={20} /> Create New Flow
                    </button>
                </div>

            {isCreating && (
                <div className="mb-8 bg-gray-900/80 border border-green-500/30 p-6 rounded-3xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleCreateFlow} className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-green-400">Add New Flow</h2>
                            <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                required
                                value={newFlowName}
                                onChange={(e) => setNewFlowName(e.target.value)}
                                placeholder="Flow Name (e.g. Sales Onboarding)"
                                className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                            />
                            <input
                                value={newFlowDesc}
                                onChange={(e) => setNewFlowDesc(e.target.value)}
                                placeholder="Description (optional)"
                                className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="bg-green-600 px-6 py-2 rounded-lg font-bold hover:bg-green-500 transition-colors">Create Flow</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flows.map(f => (
                    <div key={f._id} className={`bg-gray-900/60 border rounded-3xl p-6 transition-all group overflow-hidden relative ${f.isActive ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-gray-800 hover:border-gray-700'}`}>
                        {f.isActive && (
                            <div className="absolute top-0 right-0 bg-blue-600 text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-tighter">Live & Active</div>
                        )}
                        <h3 className="text-xl font-bold text-white mb-2 truncate">{f.name}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2 h-10 mb-6">{f.description || 'No description provided.'}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${f.isPublished ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-500'}`}>
                                {f.isPublished ? 'Published' : 'Draft'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => onEdit(f._id)}
                                className="flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold transition-all"
                            >
                                <Edit3 size={14} /> Edit Steps
                            </button>
                            <button
                                onClick={() => deleteFlow(f._id)}
                                className="flex items-center justify-center gap-2 py-2.5 bg-gray-800/50 hover:bg-red-900/40 text-gray-500 hover:text-red-400 rounded-xl text-xs font-semibold transition-all"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                            <button
                                onClick={() => toggleStatus(f._id, 'isPublished', !f.isPublished)}
                                className={`col-span-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${f.isPublished ? 'bg-gray-800 text-gray-400' : 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600 hover:text-white'}`}
                            >
                                {f.isPublished ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                                disabled={!f.isPublished}
                                onClick={() => toggleStatus(f._id, 'isActive', !f.isActive)}
                                className={`col-span-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${!f.isPublished ? 'opacity-20 grayscale cursor-not-allowed' : f.isActive ? 'bg-blue-600 text-white' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white'}`}
                            >
                                <Play size={14} fill={f.isActive ? 'white' : 'transparent'} /> {f.isActive ? 'Active' : 'Set Active'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {flows.length === 0 && (
                <div className="text-center py-20 bg-gray-900/40 border border-dashed border-gray-800 rounded-3xl">
                    <Network className="mx-auto text-gray-700 mb-4" size={48} />
                    <p className="text-gray-500">No flows found. Start by creating a new one!</p>
                </div>
            )}
            </div>
        </div>
    );
};

export default FlowManager;
