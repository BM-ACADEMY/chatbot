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
                    <div key={lead._id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:border-blue-500/40 transition-all group relative overflow-hidden shadow-2xl backdrop-blur-sm">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-blue-500/30 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                    <UserIcon size={32} className="text-blue-400 drop-shadow-glow" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white tracking-tight leading-none truncate max-w-[200px]">{lead.name}</h3>
                                    <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
                                        Real-time Conversion
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Primary Contact Details */}
                            <div className="grid grid-cols-1 gap-3">
                                <div className="bg-gray-950/60 border border-white/5 rounded-2xl p-4 hover:border-blue-500/20 transition-all">
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                                        Verified Mobile
                                    </p>
                                    <p className="text-sm text-gray-100 font-mono font-bold tracking-widest">{lead.phone}</p>
                                </div>
                                <div className="bg-gray-950/60 border border-white/5 rounded-2xl p-4 hover:border-blue-500/20 transition-all">
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <div className="w-1 h-3 bg-purple-500 rounded-full"></div>
                                        Communications Email
                                    </p>
                                    <p className="text-sm text-blue-300 font-bold truncate">{lead.email || 'Awaiting Input...'}</p>
                                </div>
                                <div className="bg-gray-950/60 border border-white/5 rounded-2xl p-4 hover:border-blue-500/20 transition-all">
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <div className="w-1 h-3 bg-teal-500 rounded-full"></div>
                                        Business / Residential Address
                                    </p>
                                    <p className="text-xs text-gray-400 font-medium leading-relaxed italic">{lead.address || 'Address data currently pending...'}</p>
                                </div>
                            </div>

                            {/* Service Badges */}
                            <div>
                                <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                                    <Tag size={12} className="text-pink-400" />
                                    Active Interest Badges
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {lead.tags?.length > 0 ? lead.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-400 border border-blue-500/20 text-xs font-black shadow-lg">
                                            {tag}
                                        </span>
                                    )) : (
                                        <div className="w-full py-3 px-4 rounded-2xl bg-gray-950/40 border border-dashed border-gray-800 flex items-center justify-center">
                                            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Identifying Intent...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Advanced Lead Insights */}
                            {lead.leadData && Object.keys(lead.leadData).length > 0 && (
                                <div className="pt-6 border-t border-white/5">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                                        <Database size={12} className="text-amber-400" />
                                        Advanced Insights
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(lead.leadData).map(([key, value]) => (
                                            <div key={key} className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/10 shadow-sm">
                                                <p className="text-[8px] text-amber-500 font-black uppercase tracking-tighter mb-1">{key.replace('_', ' ')}</p>
                                                <p className="text-xs text-amber-100 font-black truncate" title={value}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Document History */}
                            {lead.documents && lead.documents.length > 0 && (
                                <div className="pt-6 border-t border-white/5">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                                        <MessageCircle size={12} className="text-emerald-400" />
                                        Document Gallery
                                    </h4>
                                    <div className="space-y-2">
                                        {lead.documents.map((doc, idx) => (
                                            <a 
                                                key={idx} 
                                                href={`${import.meta.env.VITE_API_BASE_URL}${doc.url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-gray-950 border border-white/5 rounded-2xl hover:border-emerald-500/50 transition-all group/doc"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                        <MessageCircle size={14} className="text-emerald-400" />
                                                    </div>
                                                    <span className="text-xs text-gray-300 font-bold truncate">{doc.name || 'View Doc'}</span>
                                                </div>
                                                <div className="text-[8px] text-gray-600 font-black uppercase">{doc.type?.split('/')[1] || 'FILE'}</div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Assignment Logic */}
                            <div className="pt-6 border-t border-white/5">
                                <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                                    <UserCheck size={12} className="text-blue-400" />
                                    Lead Ownership
                                </h4>
                                {lead.assignedTo ? (
                                    <div className="flex items-center gap-3 p-4 bg-blue-600/5 border border-blue-500/10 rounded-2xl">
                                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center font-black text-blue-400 border border-blue-500/20">
                                            {lead.assignedTo.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">Handled By</p>
                                            <p className="text-sm text-blue-200 font-black">{lead.assignedTo.name}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-950/40 border border-dashed border-gray-800 rounded-2xl flex items-center justify-center text-[10px] text-gray-600 font-black uppercase tracking-widest italic">
                                        <Users size={12} className="mr-2" />
                                        Awaiting Expert Assignment
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button 
                                onClick={() => onViewChat(lead)}
                                className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl text-xs font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={14} />
                                View Conversion Journey
                            </button>
                            <button className="p-4 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-2xl border border-gray-700 transition-all active:scale-95">
                                <Search size={18} />
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
