import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Send, LogOut, Bot, CheckCircle, RefreshCcw, Paperclip, FileText, Phone, MessageCircle, Download, ExternalLink } from 'lucide-react';

const socket = io(import.meta.env.VITE_API_BASE_URL);

// ──────────────────────────────────────────────────
// LINK / BUTTON PARSER
// Converts [Label](url) markdown into interactive elements
// ──────────────────────────────────────────────────
const renderTextWithLinks = (text) => {
    if (!text) return null;
    const parts = [];
    // Regex matches [label](url) markdown link syntax
    // Matches [label](any-url) — supports tel:, https://, wa.me, mailto: etc.
    const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
        // Push plain text before this match
        if (match.index > lastIndex) {
            const segment = text.slice(lastIndex, match.index);
            parts.push(
                <span key={lastIndex} className="whitespace-pre-wrap">{segment}</span>
            );
        }

        const label = match[1];
        const url = match[2];
        const isWhatsApp = url.includes('wa.me');
        const isPhone = url.startsWith('tel:');
        const isPdf = url.endsWith('.pdf');

        if (isPhone) {
            parts.push(
                <a
                    key={match.index}
                    href={url}
                    className="inline-flex items-center gap-1.5 my-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition-all"
                >
                    <Phone size={12} /> {label}
                </a>
            );
        } else if (isWhatsApp) {
            parts.push(
                <a
                    key={match.index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 my-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 border border-green-500/40 text-green-300 rounded-xl text-xs font-bold transition-all"
                >
                    <MessageCircle size={12} /> {label}
                </a>
            );
        } else if (isPdf) {
            parts.push(
                <a
                    key={match.index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 my-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-bold transition-all"
                >
                    <Download size={12} /> {label}
                </a>
            );
        } else {
            parts.push(
                <a
                    key={match.index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 my-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition-all"
                >
                    <ExternalLink size={12} /> {label}
                </a>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    // Remaining text after last match
    if (lastIndex < text.length) {
        parts.push(
            <span key={lastIndex} className="whitespace-pre-wrap">{text.slice(lastIndex)}</span>
        );
    }

    return <>{parts}</>;
};

// ──────────────────────────────────────────────────
// SMART INPUT: renders the correct HTML input type
// based on what the bot is currently capturing
// ──────────────────────────────────────────────────
const getInputConfig = (captureMapping) => {
    switch (captureMapping) {
        case 'name':
            return {
                type: 'text',
                placeholder: 'Enter your full name (e.g. Arun Kumar)',
                maxLength: 60,
            };
        case 'phone':
            return {
                type: 'tel',
                placeholder: 'Enter 10-digit mobile number (e.g. 9876543210)',
                maxLength: 15,
                inputMode: 'tel',
            };
        case 'location':
            return {
                type: 'text',
                placeholder: 'Enter your city or area (e.g. Pondicherry)',
                maxLength: 80,
            };
        case 'email':
            return {
                type: 'email',
                placeholder: 'Enter your email address (e.g. you@gmail.com)',
            };
        case 'demo_date':
            return {
                type: 'date',
                placeholder: '',
                min: new Date().toISOString().split('T')[0],
            };
        default:
            return {
                type: 'text',
                placeholder: 'Type your response...',
            };
    }
};

// ──────────────────────────────────────────────────
// TIME SLOT GENERATOR
// Mon-Sat: 9:30 AM – 6:30 PM (every 30 min)
// Sunday:  9:30 AM – 8:00 PM (every 30 min)
// ──────────────────────────────────────────────────
const generateTimeSlots = (dateStr) => {
    const slots = [];
    let dayOfWeek = -1; // unknown

    if (dateStr) {
        // Parse YYYY-MM-DD safely without timezone shift
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
    }

    // End time: Sunday = 20:00, Mon-Sat = 18:30
    const isSunday = dayOfWeek === 0;
    const endH = isSunday ? 20 : 18;
    const endM = isSunday ? 0 : 30;

    let h = 9, m = 30; // start at 9:30 AM
    while (h < endH || (h === endH && m <= endM)) {
        const period = h < 12 ? 'AM' : 'PM';
        const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const displayM = m === 0 ? '00' : m;
        slots.push(`${displayH}:${displayM} ${period}`);
        m += 30;
        if (m >= 60) { m = 0; h++; }
    }
    return slots;
};

// ──────────────────────────────────────────────────
// TIME SLOT PICKER COMPONENT (inline in footer)
// ──────────────────────────────────────────────────
const TimeSlotPicker = ({ messages, onSelectSlot }) => {
    // Find the last user message (before bot asked for time) — it contains the chosen date
    const userMessages = messages.filter(m => !m.isBotResponse);
    const lastUserMsg = userMessages[userMessages.length - 1];
    const dateStr = lastUserMsg?.text || '';

    const slots = generateTimeSlots(dateStr);

    // Get day label for display
    let dayLabel = '';
    let isSunday = false;
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, mo, d] = dateStr.split('-').map(Number);
        const date = new Date(y, mo - 1, d);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        dayLabel = days[date.getDay()];
        isSunday = date.getDay() === 0;
    }

    return (
        <div className="flex flex-col gap-3 p-4 bg-gray-950 border-t border-gray-800">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-white">⏰ Select Your Demo Time Slot</p>
                    {dayLabel && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                            {dayLabel} · Available: {isSunday ? '9:30 AM – 8:00 PM' : '9:30 AM – 6:30 PM'}
                        </p>
                    )}
                </div>
                {!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? (
                    <span className="text-[10px] text-amber-400 font-bold">⚠ Date not detected — showing all slots</span>
                ) : null}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {slots.map((slot) => (
                    <button
                        key={slot}
                        onClick={() => onSelectSlot(slot)}
                        className="px-2 py-2.5 bg-gray-900 hover:bg-blue-600/20 border border-gray-700 hover:border-blue-500/60 text-gray-300 hover:text-white rounded-xl text-[11px] font-bold transition-all active:scale-95 text-center"
                    >
                        {slot}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────
const UserChat = ({ isEmbedded = false, previewFlowId = null }) => {
    const { user, logout } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [inputError, setInputError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const hasInitialized = useRef(false);

    // Get the last bot message to determine what input the bot expects
    const lastBotMsg = [...messages].reverse().find(m => m.isBotResponse);
    const isWaitingForFile = lastBotMsg?.captureType === 'file';
    const currentCaptureMapping = lastBotMsg?.captureMapping || null;
    const inputConfig = getInputConfig(currentCaptureMapping);
    const isFlowComplete = lastBotMsg && !currentCaptureMapping && (!lastBotMsg.options || lastBotMsg.options.length === 0) && !isWaitingForFile;

    const handleRestartChat = () => {
        if (isEmbedded) {
            logout(); // for guests, this creates a fully new lead profile
        } else {
            hasInitialized.current = false; // Allow re-init for manual reset if needed, though sendMessage(null, true) handles it
            sendMessage(null, true);
        }
    };

    const sendMessage = async (e, isReset = false, fileMetaData = null) => {
        if (e) e.preventDefault();
        if (!input.trim() && !isReset && !fileMetaData) return;
        if (inputError) return; // Block submission if validation fails

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

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/messages/${user._id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (data.length === 0 && !hasInitialized.current) {
                hasInitialized.current = true;
                await sendMessage(null, true);
            } else if (data.length > 0) {
                setMessages(data);
                hasInitialized.current = true;
            }
        } catch (error) {
            console.error("Error fetching messages", error);
        }
    };

    useEffect(() => {
        if (user) {
            socket.emit('join_room', user._id);
            if (previewFlowId && !hasInitialized.current) {
                hasInitialized.current = true;
                sendMessage(null, true);
            } else if (!previewFlowId) {
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
        return () => { socket.off('receive_message', handleReceiveMessage); };
    }, [user, previewFlowId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Live Validation ──────────────────────────
    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        setInputError('');

        if (!val) return; // Don't validate empty while typing

        switch (currentCaptureMapping) {
            case 'name': {
                if (val.trim().length < 2)
                    setInputError('Name must be at least 2 characters');
                else if (!/^[a-zA-Z\s.'-]+$/.test(val))
                    setInputError('Name should only contain letters');
                break;
            }
            case 'phone': {
                const digits = val.replace(/[\s\-+()]/g, '');
                if (!/^\d+$/.test(digits))
                    setInputError('Phone number must contain only digits');
                else if (digits.length < 10)
                    setInputError('Phone number must be at least 10 digits');
                else if (digits.length > 13)
                    setInputError('Phone number is too long');
                break;
            }
            case 'location': {
                if (val.trim().length < 2)
                    setInputError('Please enter a valid location');
                break;
            }
            case 'email': {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
                    setInputError('Enter a valid email address (e.g. you@gmail.com)');
                break;
            }
            case 'demo_date': {
                const today = new Date().toISOString().split('T')[0];
                if (val < today)
                    setInputError('Please select a future date');
                break;
            }
            default:
                if (val.trim().length < 1)
                    setInputError('This field cannot be empty');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/upload`, formData, {
                headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' }
            });
            await sendMessage(null, false, data);
        } catch (error) {
            console.error("Upload failed", error);
            alert("File upload failed. Please try again.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
            {/* Header */}
            {!isEmbedded ? (
                <header className="flex items-center justify-between p-5 bg-gray-900 border-b border-gray-800 shadow-md z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        {/* <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/5">
                            <Bot className="text-white" size={28} />
                        </div> */}
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

            {/* Messages */}
            <main className={`flex-1 overflow-y-auto p-5 space-y-6 ${isEmbedded ? 'bg-gray-900' : 'bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-gray-950'}`}>
                {messages.filter(msg => msg.text !== 'Resetting journey...').map((msg, index) => {
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
                                        </div>
                                    </div>
                                ) : (
                                    /* Render text with link parsing */
                                    <div className="text-sm font-medium leading-relaxed">
                                        {renderTextWithLinks(msg.text)}
                                    </div>
                                )}

                                {/* Options / Buttons */}
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
                    );
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

            {/* Footer Input Area */}
            <footer className="bg-gray-950 border-t border-gray-800 shrink-0">

                {/* ── FLOW COMPLETE STATE (RESTART BUTTON) ── */}
                {isFlowComplete ? (
                    <div className="p-6 flex flex-col items-center justify-center gap-3">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest text-center">Chat Session Completed</p>
                        <button 
                            onClick={handleRestartChat}
                            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCcw size={16} /> Start New Enquiry
                        </button>
                    </div>
                ) : currentCaptureMapping === 'demo_time' ? (
                    <TimeSlotPicker
                        messages={messages}
                        onSelectSlot={async (slot) => {
                            try {
                                const { data } = await axios.post(
                                    `${import.meta.env.VITE_API_BASE_URL}/api/messages`,
                                    {
                                        receiverId: null,
                                        text: slot,
                                        actionNextStep: null,
                                        previewFlowId
                                    },
                                    { headers: { Authorization: `Bearer ${user.token}` } }
                                );
                                socket.emit('send_message', data.message);
                                setMessages(prev => [...prev, data.message]);
                                if (data.botResponse) {
                                    socket.emit('send_message', data.botResponse);
                                    setMessages(prev => [...prev, data.botResponse]);
                                }
                            } catch (err) {
                                console.error(err);
                            }
                        }}
                    />
                ) : (
                    <form onSubmit={sendMessage} className="flex flex-col gap-2 p-5">
                        <div className="flex gap-3 items-center">
                            <div className="relative flex-1 group">
                                <input
                                    id="chat-input"
                                    type={isWaitingForFile ? 'text' : inputConfig.type}
                                    value={input}
                                    onChange={handleInputChange}
                                    disabled={isUploading}
                                    placeholder={isWaitingForFile ? 'Please upload a document...' : inputConfig.placeholder}
                                    pattern={inputConfig.pattern}
                                    inputMode={inputConfig.inputMode}
                                    min={inputConfig.min}
                                    maxLength={inputConfig.maxLength}
                                    className={`w-full bg-gray-900 border rounded-2xl px-5 py-3.5 text-xs text-white focus:outline-none focus:ring-2 transition-all placeholder-gray-600 shadow-inner disabled:opacity-50
                                        ${inputError ? 'border-red-500/60 focus:ring-red-500/30' : 'border-gray-800 focus:ring-blue-500/40'}
                                        ${inputConfig.type === 'date' ? 'cursor-pointer' : ''}
                                    `}
                                />

                                {/* File upload button */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
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
                            </div>

                            {!isWaitingForFile && (
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isUploading || !!inputError}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-30 disabled:scale-100 text-white p-4 rounded-2xl transition-all shadow-xl flex items-center justify-center shadow-blue-500/10 hover:scale-105 active:scale-95 shrink-0"
                                >
                                    <Send size={18} />
                                </button>
                            )}
                        </div>

                        {/* Live Validation Error */}
                        {inputError && (
                            <p className="text-xs text-red-400 font-semibold pl-2 animate-in fade-in duration-200">
                                ⚠ {inputError}
                            </p>
                        )}

                        {/* Input type hint */}
                        {currentCaptureMapping && !isWaitingForFile && (
                            <p className="text-[11px] text-gray-500 font-medium pl-1 flex items-center gap-1.5">
                                {currentCaptureMapping === 'name'      && <><span>✏️</span> Enter your full name</>}
                                {currentCaptureMapping === 'phone'     && <><span>📞</span> Enter your 10-digit mobile number</>}
                                {currentCaptureMapping === 'location'  && <><span>📍</span> Enter your city or area</>}
                                {currentCaptureMapping === 'email'     && <><span>📧</span> Enter a valid email address</>}
                                {currentCaptureMapping === 'demo_date' && <><span>📅</span> Select a date — today or later (no Sundays restriction)</>}
                            </p>
                        )}
                    </form>
                )}
            </footer>
        </div>
    );
};

export default UserChat;
