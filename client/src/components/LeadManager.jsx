import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { Search, Filter, User as UserIcon, Tag, UserCheck, MessageCircle, Users, Database } from 'lucide-react';

const LeadManager = ({ onViewChat }) => {
    const { user } = useContext(AuthContext);
    const [leads, setLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTag, setFilterTag] = useState('');

    const fetchLeads = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/users`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setLeads(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [user.token]);

    const filteredLeads = leads.filter(l => 
        (l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         l.phone.includes(searchTerm)) &&
        (filterTag === '' || l.tags.includes(filterTag))
    );

    const allTags = Array.from(new Set(leads.flatMap(l => l.tags)));

    return (
        <div className="p-8 h-full overflow-y-auto relative z-10 w-full max-w-7xl mx-auto font-sans">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Lead Intelligence Board</h1>
                    <p className="text-gray-400 mt-1">Real-time CRM insights for ABM Groups.</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-64 shadow-xl"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <select
                            value={filterTag}
                            onChange={(e) => setFilterTag(e.target.value)}
                            className="bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none w-48 shadow-xl"
                        >
                            <option value="">All Tags</option>
                            {allTags.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLeads.map(lead => (
                    <div key={lead._id} className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden backdrop-blur-xl">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center border border-gray-700 shadow-inner group-hover:scale-110 transition-transform">
                                    <UserIcon size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white truncate w-40">{lead.name}</h3>
                                    <p className="text-xs text-gray-500 font-mono">{lead.phone}</p>
                                </div>
                            </div>
                            <div className="bg-gray-950/50 border border-gray-800 rounded-lg p-2 flex items-center gap-1">
                                <MessageCircle size={14} className="text-green-500" />
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Chat Active</span>
                            </div>
                        </div>

                        <div className="mb-6 space-y-3">
                            <div>
                                <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                    <Tag size={12} className="text-purple-400" />
                                    Lead Tags
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {lead.tags?.length > 0 ? lead.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                                            {tag}
                                        </span>
                                    )) : <span className="text-[10px] text-gray-600 italic">No tags yet</span>}
                                </div>
                            </div>

                            {/* Captured Lead Data (Dynamic Fields like Address, Mode, etc) */}
                            {lead.leadData && Object.keys(lead.leadData).length > 0 && (
                                <div className="pt-3 border-t border-gray-800/50">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                        <Database size={12} className="text-blue-400" />
                                        Collected Insights
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(lead.leadData).map(([key, value]) => (
                                            <div key={key} className="bg-gray-950/50 rounded-lg p-2 border border-gray-800/50">
                                                <p className="text-[8px] text-gray-600 font-black uppercase tracking-tighter mb-0.5">{key.replace('_', ' ')}</p>
                                                <p className="text-[10px] text-blue-100 font-bold truncate" title={value}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Document Gallery */}
                            {lead.documents && lead.documents.length > 0 && (
                                <div className="pt-3 border-t border-gray-800/50">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                        <FileText size={12} className="text-emerald-400" />
                                        Document History
                                    </h4>
                                    <div className="space-y-1.5">
                                        {lead.documents.map((doc, idx) => (
                                            <a 
                                                key={idx} 
                                                href={`${import.meta.env.VITE_API_BASE_URL}${doc.url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-2 bg-gray-950 border border-gray-800 rounded-lg hover:border-emerald-500/50 transition-all group"
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <FileText size={14} className="text-gray-500 group-hover:text-emerald-400" />
                                                    <span className="text-[10px] text-gray-400 group-hover:text-white truncate font-medium">{doc.name || 'Document'}</span>
                                                </div>
                                                <span className="text-[8px] text-gray-600 font-bold uppercase shrink-0">{doc.type.split('/')[1] || 'FILE'}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-3 border-t border-gray-800/50">
                                <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                    <UserCheck size={12} className="text-green-400" />
                                    Assignment Status
                                </h4>
                                {lead.assignedTo ? (
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-gray-200 font-bold bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
                                            Assigned to: <span className="text-green-400">{lead.assignedTo.name}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-500 italic px-3 py-1 bg-gray-800/10 rounded-lg border border-dashed border-gray-800 flex items-center gap-2 justify-center">
                                        Unassigned Lead
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 relative z-10">
                            <button 
                                onClick={() => onViewChat(lead)}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
                            >
                                View Conversion
                            </button>
                            <button className="px-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all border border-gray-700">
                                <Search size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredLeads.length === 0 && (
                <div className="text-center py-24 bg-gray-900/40 border-2 border-dashed border-gray-800 rounded-[3rem]">
                    <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700 shadow-inner">
                        <Users size={40} className="text-gray-700" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-400 mb-1">No leads found in this view.</h2>
                    <p className="text-gray-600 text-sm">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
};

export default LeadManager;
