import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import {
    Search, Filter, Users, Database, MessageCircle, UserCheck,
    Tag, ChevronDown, ChevronUp, RefreshCw, CalendarClock, Phone, MapPin, Mail,
    Download, Trash2, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, X,
    Info, FileText, Building, Briefcase, Clock, ArrowUpRight, ExternalLink
} from 'lucide-react';

const DEEP_BLUE_GRADIENT = "from-blue-600/20 to-indigo-600/20";
const BORDER_STYLE = "border-blue-500/20";

const DetailRow = ({ icon: Icon, label, value, color = "text-blue-400" }) => (
    <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-2xl border border-gray-800/50 shadow-sm transition-all hover:bg-gray-800/50 group">
        <div className={`p-2.5 rounded-xl bg-gray-950 border border-gray-800 ${color} group-hover:scale-110 transition-transform`}>
            <Icon size={18} />
        </div>
        <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm text-gray-200 font-bold">{value || <span className="text-gray-600 italic font-medium">Not Provided</span>}</p>
        </div>
    </div>
);

const MISSING = ({ label }) => (
    <span className="italic text-gray-600 text-xs">— {label || 'Not provided'}</span>
);

const LeadManager = ({ onViewChat }) => {
    const { user } = useContext(AuthContext);
    const [leads, setLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTag, setFilterTag] = useState('');
    const [sortKey, setSortKey] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // UI States
    const [deletingLead, setDeletingLead] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null); // Full Intelligence Panel
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState(null);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/users`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setLeads(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchLeads(); }, [user.token]);

    const allTags = Array.from(new Set(leads.flatMap(l => l.tags || [])));

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const filteredLeads = leads
        .filter(l =>
            ((l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (l.phone || '').includes(searchTerm) ||
             (l.email || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterTag === '' || (l.tags || []).includes(filterTag))
        )
        .sort((a, b) => {
            let av = a[sortKey] || '';
            let bv = b[sortKey] || '';
            
            if (sortKey === 'demo_date') {
                av = a.leadData?.demo_date || '';
                bv = b.leadData?.demo_date || '';
            }

            // Enhanced Comparison (covers Dates and Strings)
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
    const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page to 1 when search or filter changes
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterTag]);

    const SortIcon = ({ col }) => sortKey === col
        ? (sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-400" /> : <ChevronDown size={12} className="text-blue-400" />)
        : <ChevronDown size={12} className="text-gray-600" />;

    const ThBtn = ({ col, children }) => (
        <button
            onClick={() => toggleSort(col)}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
        >
            {children}<SortIcon col={col} />
        </button>
    );

    // Stats summary
    const missingPhone   = leads.filter(l => !l.phone).length;
    const missingEmail   = leads.filter(l => !l.email).length;
    const bookedDemo     = leads.filter(l => l.leadData?.demo_date).length;

    const confirmDeleteLead = async () => {
        if (!deletingLead) return;
        setIsDeleting(true);
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/auth/users/${deletingLead._id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setToast({ type: 'success', message: 'Lead permanently deleted.' });
            setDeletingLead(null);
            fetchLeads();
        } catch (err) {
            console.error("Failed to delete lead:", err);
            setToast({ type: 'error', message: 'Failed to delete lead.' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExportCSV = () => {
        if (filteredLeads.length === 0) return;
        
        // Define CSV headers
        const headers = ['Name', 'Phone', 'Email', 'Location', 'Status', 'Qualification/Exp', 'Budget', 'Property Type', 'Demo Date', 'Demo Time'];
        
        // Map filtered rows
        const rows = filteredLeads.map(l => [
            `"${l.name || ''}"`,
            `"${l.phone || ''}"`,
            `"${l.email || ''}"`,
            `"${l.address || ''}"`,
            `"${l.leadStatus || 'New'}"`,
            `"${l.leadData?.job_qual_exp || ''}"`,
            `"${l.leadData?.property_budget || ''}"`,
            `"${l.leadData?.property_type || ''}"`,
            `"${l.leadData?.demo_date || ''}"`,
            `"${l.leadData?.demo_time || ''}"`
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 h-full overflow-y-auto relative z-10 w-full font-sans">

            {/* ── Header ─────────────────────────── */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Lead Intelligence Board</h1>
                    <p className="text-gray-500 text-xs mt-1">All captured lead data — missing fields are highlighted</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExportCSV} disabled={filteredLeads.length === 0} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl border border-emerald-500/30 text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hidden sm:flex">
                        <Download size={14} /> Export CSV
                    </button>
                    <button onClick={fetchLeads} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl border border-gray-700 text-xs font-bold transition-all">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* ── Summary Cards ─────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Leads', value: leads.length, color: 'from-blue-600/20 to-purple-600/20', border: 'border-blue-500/20', icon: <Users size={18} className="text-blue-400" /> },
                    { label: 'Demo Booked', value: bookedDemo, color: 'from-emerald-600/20 to-teal-600/20', border: 'border-emerald-500/20', icon: <CalendarClock size={18} className="text-emerald-400" /> },
                    { label: 'Missing Phone', value: missingPhone, color: 'from-amber-600/20 to-orange-600/20', border: 'border-amber-500/20', icon: <Phone size={18} className="text-amber-400" /> },
                    { label: 'Missing Email', value: missingEmail, color: 'from-red-600/20 to-pink-600/20', border: 'border-red-500/20', icon: <Mail size={18} className="text-red-400" /> },
                ].map(({ label, value, color, border, icon }) => (
                    <div key={label} className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-4 flex items-center gap-3`}>
                        <div className="p-2 bg-black/20 rounded-lg">{icon}</div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{label}</p>
                            <p className="text-2xl font-black text-white">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filters ───────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative group flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-xl"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <select
                        value={filterTag}
                        onChange={(e) => setFilterTag(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none w-52 shadow-xl"
                    >
                        <option value="">All Tags</option>
                        {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Table ─────────────────────────── */}
            <div className="rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-900 border-b border-gray-800">
                                <th className="px-4 py-3.5"><ThBtn col="name">Name</ThBtn></th>
                                <th className="px-4 py-3.5"><ThBtn col="phone">Phone</ThBtn></th>
                                <th className="px-4 py-3.5"><ThBtn col="email">Email</ThBtn></th>
                                <th className="px-4 py-3.5">
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <MapPin size={12} /> Location
                                    </span>
                                </th>
                                <th className="px-4 py-3.5">
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <Tag size={12} /> Tags
                                    </span>
                                </th>
                                <th className="px-4 py-3.5"><ThBtn col="demo_date">Demo Date</ThBtn></th>
                                <th className="px-4 py-3.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Demo Time</span>
                                </th>
                                <th className="px-4 py-3.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Assigned To</span>
                                </th>
                                <th className="px-4 py-3.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-16 text-gray-600 text-sm bg-gray-950">
                                        <RefreshCw className="mx-auto mb-3 animate-spin opacity-40" size={28} />
                                        Loading leads...
                                    </td>
                                </tr>
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-16 text-gray-600 text-sm bg-gray-950">
                                        <Users className="mx-auto mb-3 opacity-20" size={36} />
                                        No leads match your filters
                                    </td>
                                </tr>
                            ) : paginatedLeads.map((lead, i) => {
                                const demoDate = lead.leadData?.demo_date;
                                const demoTime = lead.leadData?.demo_time;
                                const isCriticalMissing = !lead.name || lead.name === 'Anonymous Lead' || !lead.phone || (lead.phone && lead.phone.startsWith('guest_'));

                                return (
                                    <tr
                                        key={lead._id}
                                        className={`border-b border-gray-800/60 transition-colors hover:bg-gray-900/60 ${i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'}`}
                                    >
                                        {/* Name */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-xs font-black text-blue-300">
                                                    {(lead.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{lead.name || <MISSING label="Name" />}</p>
                                                    {isCriticalMissing && (
                                                        <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">⚠ Incomplete</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Phone */}
                                        <td className="px-4 py-3.5">
                                            {lead.phone
                                                ? <span className="text-xs font-mono text-gray-200">{lead.phone}</span>
                                                : <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold">Missing</span>
                                            }
                                        </td>

                                        {/* Email */}
                                        <td className="px-4 py-3.5">
                                            {lead.email
                                                ? <span className="text-xs text-blue-300 truncate max-w-[160px] block">{lead.email}</span>
                                                : <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold">Missing</span>
                                            }
                                        </td>

                                        {/* Location */}
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs text-gray-400">
                                                {lead.address || lead.leadData?.location || <MISSING label="Location" />}
                                            </span>
                                        </td>

                                        {/* Tags */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex flex-wrap gap-1">
                                                {lead.tags?.length > 0
                                                    ? lead.tags.map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                                                            {tag}
                                                        </span>
                                                    ))
                                                    : <MISSING label="No tags" />
                                                }
                                            </div>
                                        </td>

                                        {/* Demo Date */}
                                        <td className="px-4 py-3.5">
                                            {demoDate
                                                ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
                                                        <CalendarClock size={12} /> {demoDate}
                                                    </span>
                                                )
                                                : <span className="px-2 py-1 bg-gray-800 text-gray-600 rounded-lg text-[10px] font-bold">Not Booked</span>
                                            }
                                        </td>

                                        {/* Demo Time */}
                                        <td className="px-4 py-3.5">
                                            {demoTime
                                                ? <span className="text-xs text-emerald-300 font-bold">{demoTime}</span>
                                                : <MISSING label="—" />
                                            }
                                        </td>

                                        {/* Assigned To */}
                                        <td className="px-4 py-3.5">
                                            {lead.assignedTo
                                                ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400">
                                                            {lead.assignedTo.name?.charAt(0)}
                                                        </div>
                                                        <span className="text-xs text-blue-200 font-bold">{lead.assignedTo.name}</span>
                                                    </div>
                                                )
                                                : <span className="px-2 py-1 bg-gray-800/60 text-gray-600 rounded-lg text-[10px] font-bold italic">Unassigned</span>
                                            }
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedLead(lead)}
                                                    className="flex items-center justify-center p-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 hover:text-white border border-purple-500/30 rounded-xl transition-all active:scale-95"
                                                    title="View Full Intelligence"
                                                >
                                                    <Info size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onViewChat(lead)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold transition-all active:scale-95"
                                                >
                                                    <MessageCircle size={12} /> View Chat
                                                </button>
                                                <button
                                                    onClick={() => setDeletingLead(lead)}
                                                    className="flex items-center justify-center p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-200 border border-red-500/30 rounded-xl transition-all active:scale-95"
                                                    title="Delete Lead"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer row */}
                {filteredLeads.length > 0 && (
                    <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-gray-500">
                            Showing <span className="text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white font-bold">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of <span className="text-white font-bold">{filteredLeads.length}</span> leads
                        </p>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-xs font-bold text-gray-400 mx-2">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest hidden sm:flex">
                            <Database size={12} />
                            BM Academy Intelligence
                        </div>
                    </div>
                )}
            </div>

            {/* ── Delete Confirmation Modal ── */}
            {deletingLead && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setDeletingLead(null)}
                            disabled={isDeleting}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="flex flex-col items-center items-center text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                                <AlertTriangle className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Delete Lead?</h3>
                            <p className="text-sm text-gray-400 mb-6">
                                Are you sure you want to delete <span className="text-white font-bold">{deletingLead.name || 'this lead'}</span>? This action cannot be undone.
                            </p>
                            
                            <div className="flex w-full gap-3">
                                <button
                                    onClick={() => setDeletingLead(null)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteLead}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isDeleting ? <RefreshCw className="animate-spin" size={16} /> : 'Delete Permanently'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Lead Intelligence Detail Panel (Side Drawer) ── */}
            {selectedLead && (
                <div className="fixed inset-0 z-[60] flex justify-end animate-in fade-in duration-300">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedLead(null)} />
                    
                    {/* Drawer Content */}
                    <div className="relative w-full max-w-2xl bg-gray-950 border-l border-gray-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500">
                        {/* Header */}
                        <div className="p-8 border-b border-gray-800 bg-gray-900/30 backdrop-blur-sm sticky top-0 z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-800 flex items-center justify-center text-2xl font-black text-white shadow-lg border border-white/10 ring-4 ring-blue-500/10">
                                        {(selectedLead.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tight">{selectedLead.name || "Anonymous Lead"}</h2>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 animate-pulse bg-blue-400 rounded-full" />
                                                Lead Stage: {selectedLead.leadStatus || "New"}
                                            </span>
                                            <span className="text-gray-600 text-[10px] font-bold">ID: {selectedLead._id.slice(-8)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLead(null)} className="p-3 bg-gray-900 hover:bg-gray-800 text-gray-500 hover:text-white rounded-2xl border border-gray-800 transition-all active:scale-95">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 rounded-xl border border-gray-800">
                                    <Phone size={14} className="text-gray-500" />
                                    <span className="text-xs text-gray-300 font-bold">{selectedLead.phone || "No Phone"}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 rounded-xl border border-gray-800">
                                    <Mail size={14} className="text-gray-500" />
                                    <span className="text-xs text-gray-300 font-bold">{selectedLead.email || "No Email"}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 rounded-xl border border-gray-800">
                                    <MapPin size={14} className="text-gray-500" />
                                    <span className="text-xs text-gray-300 font-bold">{selectedLead.address || "No Location"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin">
                            
                            {/* Career & Skills Section */}
                            <section>
                                <div className="flex items-center gap-3 mb-5">
                                    <Briefcase size={20} className="text-purple-400" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Career Intelligence</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DetailRow icon={FileText} label="Qual & Experience" value={selectedLead.leadData?.job_qual_exp} color="text-purple-400" />
                                    <DetailRow icon={MapPin} label="Preferred Location" value={selectedLead.leadData?.job_pref_location} color="text-purple-400" />
                                </div>
                                
                                {selectedLead.userAttachments && selectedLead.userAttachments.length > 0 && (
                                    <div className="mt-4 p-5 bg-purple-600/5 border border-purple-500/20 rounded-2xl flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-600/10 rounded-xl border border-purple-500/30 text-purple-400">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Resume / Document</p>
                                                <p className="text-sm font-bold text-white max-w-[200px] truncate">{selectedLead.userAttachments[0].name}</p>
                                            </div>
                                        </div>
                                        <a 
                                            href={`${import.meta.env.VITE_API_BASE_URL}${selectedLead.userAttachments[0].url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
                                        >
                                            <Download size={14} /> Download
                                        </a>
                                    </div>
                                )}
                            </section>

                            {/* Property Section */}
                            <section>
                                <div className="flex items-center gap-3 mb-5">
                                    <Building size={20} className="text-blue-400" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Property Interests</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DetailRow icon={Database} label="Plan / Budget" value={selectedLead.leadData?.property_budget} color="text-blue-400" />
                                    <DetailRow icon={RefreshCw} label="Property Type" value={selectedLead.leadData?.property_type} color="text-blue-400" />
                                    <DetailRow icon={MapPin} label="Preferred Area" value={selectedLead.leadData?.property_pref_location} color="text-blue-400" />
                                    <DetailRow icon={Tag} label="Price Estimate" value={selectedLead.leadData?.property_price} color="text-blue-400" />
                                </div>
                            </section>

                            {/* Service Enquiries Timeline */}
                            <section className="pb-10">
                                <div className="flex items-center gap-3 mb-5">
                                    <Clock size={20} className="text-emerald-400" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Enquiry History</h3>
                                </div>
                                <div className="space-y-3">
                                    {selectedLead.enquiries && selectedLead.enquiries.length > 0 ? (
                                        selectedLead.enquiries.map((enq, idx) => (
                                            <div key={idx} className="p-4 bg-gray-900/30 border border-gray-800 rounded-2xl flex items-center justify-between group hover:bg-gray-900/60 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                                        <ArrowUpRight size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-200">{enq.service}</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">{new Date(enq.timestamp).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-gray-950 border border-gray-800 rounded-lg text-[9px] font-bold text-gray-400 group-hover:text-emerald-400 transition-colors uppercase tracking-widest">
                                                    Captured
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center bg-gray-900/20 border border-dashed border-gray-800 rounded-3xl">
                                            <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">No detailed enquiries found</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                        
                        {/* Footer Actions */}
                        <div className="p-8 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm flex gap-3">
                            <button 
                                onClick={() => {
                                    onViewChat(selectedLead);
                                    setSelectedLead(null);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                            >
                                <MessageCircle size={16} /> Open Full Chat History
                            </button>
                            {selectedLead.leadData?.demo_date && (
                                <div className="flex items-center gap-3 px-6 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                                    <CalendarClock size={18} />
                                    <div className="text-left">
                                        <p className="text-[8px] font-black uppercase tracking-widest leading-none">Booked For</p>
                                        <p className="text-[11px] font-bold mt-1">{selectedLead.leadData.demo_date} • {selectedLead.leadData.demo_time}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast Notification ── */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
                        toast.type === 'success' 
                            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' 
                            : 'bg-red-950/90 border-red-500/30 text-red-400'
                    } backdrop-blur-md`}>
                        {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <p className="font-bold text-sm text-white">{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadManager;
