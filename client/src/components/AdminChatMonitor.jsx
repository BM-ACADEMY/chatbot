import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import { Search, User as UserIcon, Send, MessageSquare } from 'lucide-react';

const socket = io(import.meta.env.VITE_API_BASE_URL);

const AdminChatMonitor = ({ initialSelectedUser }) => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(initialSelectedUser || null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Filter users based on search term
    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.phone?.includes(searchTerm)
    );

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/users`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setUsers(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchUsers();

        const handleReceiveMessage = (message) => {
            if (selectedUser && (message.senderId === selectedUser._id || message.receiverId === selectedUser._id)) {
                setMessages(prev => {
                    if (prev.find(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
        };

        socket.on('receive_admin_message', handleReceiveMessage);
        socket.on('receive_message', handleReceiveMessage); // Optional, depending on backend logic

        return () => {
            socket.off('receive_admin_message', handleReceiveMessage);
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [user.token, selectedUser]);

    useEffect(() => {
        if (selectedUser) {
            const fetchMessages = async () => {
                try {
                    const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/messages/${selectedUser._id}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    setMessages(data);
                } catch (error) {
                    console.error(error);
                }
            };
            fetchMessages();
        }
    }, [selectedUser, user.token]);

    useEffect(() => {
        if (initialSelectedUser) {
            setSelectedUser(initialSelectedUser);
        }
    }, [initialSelectedUser]);

    useEffect(() => {
        if (messagesEndRef.current) {
            const container = messagesEndRef.current;
            // Use requestAnimationFrame to ensure DOM is settled before calculating scroll
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !selectedUser) return;
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/messages`, {
                receiverId: selectedUser._id,
                text: input,
            }, { headers: { Authorization: `Bearer ${user.token}` } });

            socket.emit('send_message', data);
            setMessages(prev => [...prev, data]);
            setInput('');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-1 min-h-0 w-full p-0 gap-0 relative z-10 overflow-hidden bg-transparent">
            {/* Users List Sidebar - Using internal padding for spacing instead of outer p-4 */}
            <div className="w-80 h-full p-4 pr-2 flex flex-col overflow-hidden shrink-0">
                <div className="flex-1 bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl shrink-0">
                    <div className="p-4 border-b border-gray-800 bg-gray-900/80 flex-shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-950/50 border border-gray-700 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {filteredUsers.map(u => (
                            <button
                                key={u._id}
                                onClick={() => setSelectedUser(u)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedUser?._id === u._id ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 shadow-inner' : 'hover:bg-gray-800/80 border border-transparent'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                                    <UserIcon size={18} className="text-gray-400" />
                                </div>
                                <div className="text-left overflow-hidden">
                                    <p className="text-sm font-semibold text-gray-200 truncate">{u.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{u.phone}</p>
                                </div>
                            </button>
                        ))}
                        {filteredUsers.length === 0 && (
                            <p className="text-center text-sm text-gray-500 p-4">
                                {users.length === 0 ? "No active users found." : "No leads match your search."}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Chat Interface - Using flex-1 min-h-0 to lock height to dashboard */}
            <div className="flex-1 p-4 pl-2 flex flex-col overflow-hidden min-h-0 h-full">
                <div className="flex-1 bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative min-h-0">
                    {selectedUser ? (
                        <>
                            {/* Header: User Info - Absolute Pin for Guaranteed Visibility */}
                            <div className="absolute top-0 left-0 right-0 h-20 px-6 border-b border-gray-800 bg-[#0f121a]/95 backdrop-blur-xl flex items-center justify-between flex-shrink-0 z-50 rounded-t-3xl border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                                        <UserIcon size={22} className="text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-base font-bold text-white tracking-tight leading-tight">
                                            {selectedUser?.name || 'Lead Connection'}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <p className="text-xs text-gray-400 font-medium">{selectedUser?.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div 
                                ref={messagesEndRef}
                                className="flex-1 overflow-y-auto pt-24 p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/20 to-transparent"
                            >
                                {messages.map((msg, index) => {
                                    const isAdmin = msg.senderId === user._id || msg.isBotResponse;
                                    return (
                                        <div key={index} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} w-full animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`max-w-[75%] rounded-2xl p-4 shadow-xl ${isAdmin ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-sm' : 'bg-gray-800/80 backdrop-blur-sm text-gray-200 rounded-tl-sm border border-gray-700'}`}>
                                                {msg.isBotResponse && (
                                                    <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                                                        <div className="w-3 h-3 rounded-full bg-blue-400/20 flex items-center justify-center">
                                                            <div className="w-1 h-1 rounded-full bg-blue-300"></div>
                                                        </div>
                                                        <p className="text-[9px] text-blue-200 font-black uppercase tracking-[0.1em]">Automated Intelligence</p>
                                                    </div>
                                                )}
                                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                                <div className="flex items-center justify-end gap-1 mt-2.5 opacity-40">
                                                    <span className="text-[9px] font-medium">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Input Area */}
                            <div className="p-5 border-t border-gray-800 bg-gray-900/90 backdrop-blur-md flex-shrink-0">
                                <form onSubmit={sendMessage} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type your message to user..."
                                        className="flex-1 bg-gray-950/50 border border-gray-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-500 text-sm shadow-inner"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim()}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-30 disabled:grayscale disabled:scale-100 text-white p-4 rounded-2xl transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 shrink-0"
                                    >
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 animate-in fade-in duration-700">
                            <div className="w-20 h-20 bg-gray-800/30 rounded-3xl flex items-center justify-center mb-2 border border-gray-700/30">
                                <MessageSquare size={40} className="opacity-20" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-gray-300">Intelligent Monitoring</p>
                                <p className="text-sm text-gray-500">Select a connection to view conversation history</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChatMonitor;
