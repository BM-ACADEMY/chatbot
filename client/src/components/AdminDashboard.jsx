import { useState, useContext,useEffect} from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, MessageSquare, Network, Settings, Users, Menu, X } from 'lucide-react';
import FlowBuilder from './FlowBuilder';
import AdminChatMonitor from './AdminChatMonitor';
import FlowManager from './FlowManager';
import LeadManager from './LeadManager';
import axios from 'axios';

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('chats');
    const [stats, setStats] = useState({ totalUsers: 0 });
    const [editingFlowId, setEditingFlowId] = useState(null);
    const [selectedChatUser, setSelectedChatUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/users`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setStats({ totalUsers: data.length });
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, [user.token]);

    const handleEditFlow = (flowId) => {
        setEditingFlowId(flowId);
        setActiveTab('builder');
    };

    return (
        <div className="flex h-screen bg-gray-950 text-white overflow-hidden relative">
            {/* MOBILE MENU TOGGLE */}
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden fixed top-4 right-4 z-[60] p-3 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl text-blue-400"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* SIDEBAR */}
            <aside className={`
                fixed md:relative z-50 w-64 h-full bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300
                ${isMobileMenuOpen ? 'left-0' : '-left-64 md:left-0'}
            `}>
                <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        <LayoutDashboard size={20} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Admin Panel
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => { setActiveTab('chats'); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'chats' ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                    >
                        <MessageSquare size={20} />
                        <span className="font-medium">User Chats</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('leads'); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'leads' ? 'bg-gradient-to-r from-teal-600/20 to-emerald-600/20 text-teal-400 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                    >
                        <Users size={20} />
                        <span className="font-medium">Lead Manager</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('mgmt'); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'mgmt' ? 'bg-gradient-to-r from-green-600/20 to-teal-600/20 text-green-400 border border-green-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                    >
                        <Settings size={20} />
                        <span className="font-medium">Flow Management</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('builder'); setIsMobileMenuOpen(false); }}
                        disabled={!editingFlowId}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'builder' ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 border border-purple-500/30' : !editingFlowId ? 'opacity-30 grayscale cursor-not-allowed' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                    >
                        <Network size={20} />
                        <span className="font-medium">Flow Builder</span>
                    </button>

                    <div className="mt-8 pt-8 border-t border-gray-800">
                        <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Users size={18} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Users</p>
                                <p className="text-lg font-bold text-white leading-tight">{stats.totalUsers}</p>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-800 hover:bg-red-900/40 text-gray-300 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* OVERLAY FOR MOBILE */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <main className="flex-1 h-screen max-h-screen overflow-hidden relative flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 to-gray-950">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none"></div>
                
                <div className="flex-1 min-h-0 relative flex flex-col">
                    {activeTab === 'chats' && <AdminChatMonitor initialSelectedUser={selectedChatUser} />}
                    {activeTab === 'leads' && <LeadManager onViewChat={(lead) => { setSelectedChatUser(lead); setActiveTab('chats'); }} />}
                    {activeTab === 'mgmt' && <FlowManager onEdit={handleEditFlow} />}
                    {activeTab === 'builder' && editingFlowId && <FlowBuilder flowId={editingFlowId} onBack={() => setActiveTab('mgmt')} />}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
