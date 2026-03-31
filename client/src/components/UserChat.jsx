import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Send, LogOut, Bot, CheckCircle, RefreshCcw, Paperclip, FileText, Globe } from 'lucide-react';

const socket = io(import.meta.env.VITE_API_BASE_URL);

const UserChat = ({ isEmbedded = false, previewFlowId = null }) => {
    const { user, logout } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Identify if the bot is currently waiting for a file
    const lastBotMsg = [...messages].reverse().find(m => m.isBotResponse);
    const isWaitingForFile = lastBotMsg?.captureType === 'file';

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/messages/${user._id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setMessages(data);
        } catch (error) {
            console.error("Error fetching messages", error);
        }
    };

    useEffect(() => {
        if (user) {
            socket.emit('join_room', user._id);
            
            if (previewFlowId) {
                // If previewing, we want a clean start every time the modal opens
                sendMessage(null, true); 
            } else {
                fetchHistory();
            }
        }

        const handleReceiveMessage = (message) => {
            setMessages((prev) => {
                if (prev.find(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [user, previewFlowId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/upload`, formData, {
                headers: { 
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Send message with file metadata
            await sendMessage(null, false, data);
        } catch (error) {
            console.error("Upload failed", error);
            alert("File upload failed. Please try again.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const sendMessage = async (e, isReset = false, fileMetaData = null) => {
        if (e) e.preventDefault();
        if (!input.trim() && !isReset && !fileMetaData) return;

        try {
            const payload = {
                receiverId: null,
                text: isReset ? 'Resetting journey...' : (fileMetaData ? `Uploaded: ${fileMetaData.name}` : input),
                actionNextStep: null,
                previewFlowId,
                isReset,
                fileUrl: fileMetaData?.url,
                fileType: fileMetaData?.type,
                fileName: fileMetaData?.name
            };

            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/messages`, payload, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            socket.emit('send_message', data.message);
            if (isReset) {
                setMessages([data.message]);
            } else {
                setMessages((prev) => [...prev, data.message]);
            }
            setInput('');

            if (data.botResponse) {
                socket.emit('send_message', data.botResponse);
                setMessages((prev) => [...prev, data.botResponse]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleOptionSelect = async (option) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/messages`, {
                receiverId: null,
                text: option.label,
                actionNextStep: option.nextStep || 'end',
                previewFlowId
            }, { headers: { Authorization: `Bearer ${user.token}` } });

            socket.emit('send_message', data.message);
            setMessages((prev) => [...prev, data.message]);

            if (data.botResponse) {
                socket.emit('send_message', data.botResponse);
                setMessages((prev) => [...prev, data.botResponse]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className={`flex flex-col ${isEmbedded ? 'h-full bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl' : 'h-screen bg-gray-950 font-sans'}`}>
            {!isEmbedded ? (
                <header className="flex items-center justify-between p-5 bg-gray-900 border-b border-gray-800 shadow-md z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/5">
                            <Bot className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-white">ABM Connect</h1>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Intelligent Node Active
                            </p>
                        </div>
                    </div>
                    <button onClick={logout} className="p-2.5 text-gray-500 hover:text-white transition-all bg-gray-800/50 hover:bg-red-500/20 rounded-xl border border-gray-700/50">
                        <LogOut size={20} />
                    </button>
                </header>
            ) : (
                <header className="flex items-center justify-between p-4 bg-gray-950 border-b border-gray-800 shrink-0">
                     <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Bot size={14} className="text-blue-500" />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Live Journey Preview</span>
                     </div>
                     <button 
                        onClick={() => sendMessage(null, true)}
                        className="p-2 text-gray-500 hover:text-white bg-gray-900 rounded-xl transition-all border border-gray-800 hover:border-blue-500/50"
                        title="Restart Journey"
                     >
                        <RefreshCcw size={14} />
                     </button>
                </header>
            )}

            <main className={`flex-1 overflow-y-auto p-5 space-y-6 ${isEmbedded ? 'bg-gray-900' : 'bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-gray-950'}`}>
                {messages.map((msg, index) => {
                    const isUser = msg.senderId === user._id && !msg.isBotResponse;
                    return (
                        <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-xl ${isUser ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-sm' : 'bg-gray-900/80 backdrop-blur-sm text-gray-200 rounded-tl-sm border border-gray-800'}`}>
                                {msg.isBotResponse && (
                                    <div className="flex items-center gap-2 mb-2 opacity-80">
                                        <Bot size={12} className="text-blue-400" />
                                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Neural Intelligence</span>
                                    </div>
                                )}
                                
                                {msg.fileUrl ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/10 group cursor-pointer hover:bg-black/50 transition-all">
                                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                                <FileText size={20} className="text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">{msg.text.replace('Uploaded: ', '')}</p>
                                                <p className="text-[9px] opacity-60 uppercase font-bold">{msg.fileType?.split('/')[1] || 'Document'}</p>
                                            </div>
                                            <Globe size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                )}

                                {msg.options && msg.options.length > 0 && (
                                    <div className="mt-4 flex flex-col gap-2">
                                        {msg.options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionSelect(opt)}
                                                className="group text-left px-4 py-3 bg-gray-950/80 border border-gray-700/50 rounded-xl text-xs transition-all text-gray-300 hover:text-white hover:border-blue-500/50 shadow-md flex items-center justify-between active:scale-[0.98]"
                                            >
                                                <span className="font-bold">{opt.label}</span>
                                                <CheckCircle size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-800/40">
                        <div className="w-16 h-16 bg-gray-900 rounded-3xl border border-gray-800 flex items-center justify-center mb-4">
                            <Bot size={32} className="opacity-20" />
                        </div>
                        <p className="text-[8px] uppercase font-black tracking-[0.4em] ml-1">Cognitive Handshake Required</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className={`p-5 bg-gray-950 border-t border-gray-800 shrink-0`}>
                <form onSubmit={sendMessage} className="flex gap-3 items-center">
                    <div className="relative flex-1 group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isUploading}
                            placeholder={isWaitingForFile ? "Please upload a document..." : "Type your response..."}
                            className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-5 py-3.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder-gray-600 shadow-inner disabled:opacity-50"
                        />
                        
                        {(isWaitingForFile || true) && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    className="hidden" 
                                />
                                <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => fileInputRef.current.click()}
                                    className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${isWaitingForFile ? 'bg-blue-600 text-white animate-pulse shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
                                    title="Upload Document"
                                >
                                    {isUploading ? <RefreshCcw size={18} className="animate-spin text-blue-400" /> : <Paperclip size={18} />}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {!isWaitingForFile && (
                        <button
                            type="submit"
                            disabled={!input.trim() || isUploading}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-30 disabled:scale-100 text-white p-4 rounded-2xl transition-all shadow-xl flex items-center justify-center shadow-blue-500/10 hover:scale-105 active:scale-95 shrink-0"
                        >
                            <Send size={18} />
                        </button>
                    )}
                </form>
            </footer>
        </div>
    );
};

export default UserChat;
