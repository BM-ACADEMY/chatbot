import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Send, LogOut, Bot, CheckCircle, RefreshCcw, FileText, Phone, MessageCircle, Download, ExternalLink, Upload, X, Paperclip, File } from 'lucide-react';

const socket = io(import.meta.env.VITE_API_BASE_URL);

// ──────────────────────────────────────────────────
// LINK / BUTTON PARSER
// Converts [Label](url) markdown into interactive elements
// ──────────────────────────────────────────────────
const renderTextWithLinks = (text) => {
    if (!text) return null;
    const parts = [];
    
    // 1. Regex for Markdown Links: [label](url)
    const mdLinkRegex = /\[([^\]]+)\]\(([^\)]+)\)/;
    // 2. Regex for Raw URLs: http(s)://... (Improved to avoid trailing punctuation)
    const rawUrlRegex = /(https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))/;

    // Combined iterative parser
    let remaining = text;
    let key = 0;

    while (remaining) {
        const mdMatch = remaining.match(mdLinkRegex);
        const rawMatch = remaining.match(rawUrlRegex);

        let match = null;
        let type = '';

        // Choose the match that appears earliest
        if (mdMatch && (!rawMatch || mdMatch.index <= rawMatch.index)) {
            match = mdMatch;
            type = 'markdown';
        } else if (rawMatch) {
            match = rawMatch;
            type = 'raw';
        }

        if (match) {
            // Push text before the match
            if (match.index > 0) {
                parts.push(<span key={key++} className="whitespace-pre-wrap">{remaining.slice(0, match.index)}</span>);
            }

            const label = type === 'markdown' ? match[1] : match[1];
            const url = type === 'markdown' ? match[2] : match[1];

            const isWhatsApp = url.includes('wa.me');
            const isPhone = url.startsWith('tel:');
            const isPdf = url.toLowerCase().endsWith('.pdf');

            // Shared styling for link buttons
            const btnClass = "inline-flex items-center gap-1.5 my-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ";
            
            if (isPhone) {
                parts.push(
                    <a key={key++} href={url} className={btnClass + "bg-emerald-600/20 hover:bg-emerald-600/40 border-emerald-500/40 text-emerald-300"}>
                        <Phone size={12} /> {label}
                    </a>
                );
            } else if (isWhatsApp) {
                const prefix = encodeURIComponent("[Chatbot] ");
                let updatedUrl = url;
                if (url.includes('text=')) updatedUrl = url.replace('text=', `text=${prefix}`);
                else updatedUrl = `${url}${url.includes('?') ? '&' : '?'}text=${prefix}`;

                parts.push(
                    <a key={key++} href={updatedUrl} target="_blank" rel="noopener noreferrer" className={btnClass + "bg-green-600/20 hover:bg-green-600/40 border-green-500/40 text-green-300"}>
                        <MessageCircle size={12} /> {label}
                    </a>
                );
            } else if (isPdf) {
                parts.push(
                    <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className={btnClass + "bg-blue-600/20 hover:bg-blue-600/40 border-blue-500/40 text-blue-300"}>
                        <Download size={12} /> {label}
                    </a>
                );
            } else {
                parts.push(
                    <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className={btnClass + "bg-purple-600/20 hover:bg-purple-600/40 border-purple-500/40 text-purple-300"}>
                        <ExternalLink size={12} /> {label.length > 30 ? label.slice(0, 27) + "..." : label}
                    </a>
                );
            }

            remaining = remaining.slice(match.index + match[0].length);
        } else {
            // No more matches
            parts.push(<span key={key++} className="whitespace-pre-wrap">{remaining}</span>);
            remaining = '';
        }
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
                maxLength: 10,
                inputMode: 'tel',
            };
        case 'location':
            return {
                type: 'text',
                placeholder: 'Enter your City / Area (e.g. Malviya Nagar)',
                maxLength: 100,
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
        case 'property_budget':
            return {
                type: 'text',
                placeholder: 'e.g. 20L - 50L',
                maxLength: 50,
            };
        case 'property_pref_location':
        case 'property_sell_location':
            return {
                type: 'text',
                placeholder: 'Enter area (e.g. ECR, Villianur)',
                maxLength: 100,
            };
        case 'property_type':
            return {
                type: 'text',
                placeholder: 'e.g. DTCP Plot, 2BHK Villa',
                maxLength: 100,
            };
        case 'property_price':
            return {
                type: 'text',
                placeholder: 'e.g. 45 Lakhs',
                maxLength: 50,
            };
        case 'job_qual_exp':
            return {
                type: 'text',
                placeholder: 'e.g. MBA, 2 Years Experience in Sales',
                maxLength: 150,
            };
        case 'job_pref_location':
            return {
                type: 'text',
                placeholder: 'e.g. Chennai, Pondicherry',
                maxLength: 100,
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

        // Exclude 1:30 PM to 2:30 PM
        const isExcluded = (h === 13 && m === 30) || (h === 14 && m === 0) || (h === 14 && m === 30);

        if (!isExcluded) {
            slots.push(`${displayH}:${displayM} ${period}`);
        }

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
    
    // Helper to get specialized icons/colors for file types
    const getFileDisplay = (fileName, fileType) => {
        const name = fileName?.toLowerCase() || '';
        const type = fileType?.toLowerCase() || '';
        
        if (name.endsWith('.pdf') || type.includes('pdf')) {
            return {
                icon: <FileText size={20} className="text-red-400" />,
                bg: 'bg-red-500/20',
                label: 'PDF Document'
            };
        }
        if (name.endsWith('.doc') || name.endsWith('.docx') || type.includes('word') || type.includes('officedocument')) {
            return {
                icon: <FileText size={20} className="text-blue-400" />,
                bg: 'bg-blue-500/20',
                label: 'Word Document'
            };
        }
        return {
            icon: <File size={20} className="text-gray-400" />,
            bg: 'bg-gray-500/20',
            label: 'Attachment'
        };
    };

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [inputError, setInputError] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [globalError, setGlobalError] = useState(null);
    const messagesEndRef = useRef(null);
    const hasInitialized = useRef(false);
    const fileInputRef = useRef(null);

    // Get the last bot message to determine what input the bot expects
    const lastBotMsg = [...messages].reverse().find(m => m.isBotResponse);
    const isWaitingForFile = lastBotMsg?.captureType === 'file';
    const currentCaptureMapping = lastBotMsg?.captureMapping || null;
    const inputConfig = getInputConfig(currentCaptureMapping);
    const isFlowComplete = lastBotMsg && !currentCaptureMapping && (!lastBotMsg.options || lastBotMsg.options.length === 0) && !isWaitingForFile;

    // Full reset: create a brand-new guest session
    const handleRestartChat = () => {
        if (isEmbedded) {
            logout(); // for guests, this creates a fully new lead profile
        } else {
            hasInitialized.current = false;
            sendMessage(null, true);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setInputError('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
            setInputError('');
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const sendMessage = async (e, isReset = false, fileMetaData = null) => {
        if (e) e.preventDefault();
        if (!input.trim() && !isReset && !fileMetaData && !selectedFile) return;
        if (inputError) return; // Block submission if validation fails
        setGlobalError(null);

        try {
            let fileData = fileMetaData;

            // Handle manual file upload if a file is selected
            if (selectedFile && !isReset) {
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/upload`, formData, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${user.token}` 
                    }
                });
                fileData = uploadRes.data;
                setIsUploading(false);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }

            const payload = {
                receiverId: null,
                text: isReset ? 'Resetting journey...' : (fileData ? `Uploaded: ${fileData.name}` : input),
                actionNextStep: null,
                previewFlowId,
                isReset,
                fileUrl: fileData?.url,
                fileType: fileData?.type,
                fileName: fileData?.name
            };

            setIsTyping(true);
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
                // No need to socket.emit(botResponse) here because the user who triggered it 
                // already has it in their 'data' and adding it to state will display it.
                // If we emit it, the same user will receive it back via socket.
                setMessages((prev) => [...prev, data.botResponse]);
            }
        } catch (error) {
            console.error(error);
            setGlobalError(error.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsTyping(false);
            setIsUploading(false);
        }
    };

    const fetchHistory = async () => {
        if (hasInitialized.current) return;
        setIsLoadingHistory(true);
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/messages/${user._id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (data.length === 0) {
                if (!hasInitialized.current) {
                    hasInitialized.current = true;
                    await sendMessage(null, true);
                }
            } else {
                setMessages(data);
                hasInitialized.current = true;
            }
        } catch (error) {
            console.error("Error fetching messages", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (user) {
            socket.emit('join_room', user._id);

            // For Preview mode: Reset flow once
            if (previewFlowId && !hasInitialized.current) {
                hasInitialized.current = true;
                setIsLoadingHistory(true);
                sendMessage(null, true).finally(() => setIsLoadingHistory(false));
            }
            // For standard mode: Load history (which triggers reset if empty)
            else if (!previewFlowId && !hasInitialized.current) {
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
        let val = e.target.value;
        setInputError('');

        // ── Aggressive "Letters Only" filtering ──────────────────
        const letterOnlyMappings = ['name', 'location', 'property_pref_location', 'property_sell_location', 'property_type', 'job_qual_exp', 'job_pref_location'];
        if (letterOnlyMappings.includes(currentCaptureMapping)) {
            // Strip anything that is NOT a letter, space, period, or comma
            val = val.replace(/[^a-zA-Z\s.,'-]/g, '');
        }
        // ────────────────────────────────────────────────────────

        setInput(val);

        if (!val) return;

        switch (currentCaptureMapping) {
            case 'name': {
                if (val.trim().length < 2)
                    setInputError('Name must be at least 2 characters');
                break;
            }
            case 'phone': {
                const digits = val.replace(/[\s\-+()]/g, '');
                if (!/^\d+$/.test(digits))
                    setInputError('Phone number must contain only digits');
                else if (digits.length !== 10)
                    setInputError('Phone number must be exactly 10 digits');
                break;
            }
            case 'location': 
            case 'property_pref_location':
            case 'property_sell_location': {
                if (val.trim().length < 3)
                    setInputError('Please enter a valid City / Area');
                break;
            }
            case 'email': {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
                    setInputError('Enter a valid email address');
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

    const handleOptionSelect = async (option) => {
        setIsTyping(true);
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
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={`flex flex-col ${isEmbedded ? 'h-full bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl' : 'h-screen bg-gray-950 font-sans'}`}>
            {/* Header */}
            {!isEmbedded ? (
                <header className="flex items-center justify-between p-5 bg-gray-900 border-b border-gray-800 shadow-md z-10 shrink-0">
                    <div className="flex items-center gap-4">
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

                                {msg.fileUrl ? (() => {
                                    const fileInfo = getFileDisplay(msg.fileName || msg.text, msg.fileType);
                                    return (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/10 group cursor-pointer hover:bg-black/50 transition-all">
                                                <div className={`p-2 ${fileInfo.bg} rounded-lg`}>
                                                    {fileInfo.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate">{msg.text.replace('Uploaded: ', '')}</p>
                                                    <p className="text-[9px] opacity-60 uppercase font-bold tracking-wider">{fileInfo.label}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })() : (
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
                                                disabled={isTyping}
                                                onClick={() => handleOptionSelect(opt)}
                                                className={`group text-left px-4 py-3 bg-gray-950/80 border border-gray-700/50 rounded-xl text-xs transition-all text-gray-300 shadow-md flex items-center justify-between ${!isTyping ? 'hover:text-white hover:border-blue-500/50 active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
                                                    }`}
                                            >
                                                <span className="font-bold">{opt.label}</span>
                                                <CheckCircle size={14} className={`transition-all translate-x-2 ${!isTyping ? 'text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0' : 'text-gray-600 opacity-100 translate-x-0'}`} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {messages.length === 0 && !isLoadingHistory && !isTyping && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-800/40">
                        <div className="w-16 h-16 bg-gray-900 rounded-3xl border border-gray-800 flex items-center justify-center mb-4">
                            <Bot size={32} className="opacity-20" />
                        </div>
                        <p className="text-[8px] uppercase font-black tracking-[0.4em] ml-1">Cognitive Handshake Required</p>
                    </div>
                )}

                {(isTyping || isLoadingHistory) && (
                    <div className="flex justify-start w-full animate-in fade-in slide-in-from-bottom-2 duration-300 mb-4">
                        <div className="max-w-[85%] rounded-lg p-4 shadow-xl bg-gray-900/80 backdrop-blur-sm text-gray-200 border border-gray-800 flex items-center gap-2">
                            <Bot size={14} className="text-blue-400 animate-pulse" />
                            <div className="flex gap-1 ml-1" style={{ paddingTop: '2px' }}>
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Footer Input Area */}
            <footer className="bg-gray-950 border-t border-gray-800 shrink-0">
                {globalError && (
                    <div className="px-5 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between animate-in slide-in-from-top-1">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">⚠️ {globalError}</p>
                        <button onClick={() => setGlobalError(null)} className="text-gray-500 hover:text-white transition-colors">
                            <X size={12} />
                        </button>
                    </div>
                )}

                {/* ── FLOW COMPLETE STATE (FINAL THANK YOU) ── */}
                {isFlowComplete ? (
                    <div className="p-8 flex flex-col items-center justify-center gap-4 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                            <CheckCircle size={32} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm text-white font-bold">Enquiry Successfully Submitted</p>
                            <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">Our team has been notified and will contact you shortly.</p>
                        </div>
                        <button
                            onClick={handleRestartChat}
                            disabled={isTyping}
                            className="mt-2 px-6 py-2 bg-gray-900 hover:bg-gray-800 text-[10px] text-gray-400 hover:text-white font-bold uppercase tracking-wider transition-all border border-gray-800 rounded-xl"
                        >
                            Start Fresh Session
                        </button>
                    </div>
                ) : currentCaptureMapping === 'demo_time' ? (
                    <TimeSlotPicker
                        messages={messages}
                        onSelectSlot={async (slot) => {
                            setIsTyping(true);
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
                            } finally {
                                setIsTyping(false);
                            }
                        }}
                    />
                ) : (
                    <form onSubmit={sendMessage} className="flex flex-col gap-3 p-5">
                        {/* File Selection Preview */}
                        {selectedFile && (
                            <div className="flex items-center justify-between p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                        <FileText size={14} className="text-blue-400 shrink-0" />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-[11px] font-bold text-gray-200 truncate">{selectedFile.name}</span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to Upload</span>
                                    </div>
                                </div>
                                <button type="button" onClick={removeSelectedFile} className="p-2 text-gray-500 hover:text-red-400 transition-colors bg-gray-900 rounded-lg border border-gray-800 hover:border-red-500/30">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* Validation Error */}
                        {inputError && (
                            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{inputError}</p>
                            </div>
                        )}

                        <div className="flex gap-2.5 items-center">
                            <div className="relative flex-1 group">
                                {isWaitingForFile ? (
                                    <div className="flex flex-col">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            accept=".pdf,.doc,.docx"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading || isTyping}
                                            className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-950 border-2 border-dashed border-gray-800 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-2xl transition-all group disabled:opacity-50"
                                        >
                                            <div className="p-2 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                                <Upload size={18} className="text-blue-500" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[11px] font-black text-white uppercase tracking-wider">Choose Resume</p>
                                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">PDF, DOC, DOCX • MAX 10MB</p>
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            id="chat-input"
                                            type={inputConfig.type}
                                            value={input}
                                            onChange={handleInputChange}
                                            placeholder={inputConfig.placeholder}
                                            pattern={inputConfig.pattern}
                                            inputMode={inputConfig.inputMode}
                                            min={inputConfig.min}
                                            maxLength={inputConfig.maxLength}
                                            disabled={isUploading || isTyping}
                                            className={`w-full bg-gray-900 border rounded-2xl px-5 py-4 text-xs text-white focus:outline-none focus:ring-2 transition-all placeholder-gray-600 shadow-inner disabled:opacity-50
                                                ${inputError ? 'border-red-500/60 focus:ring-red-500/30' : 'border-gray-800 focus:ring-blue-500/40'}
                                                ${inputConfig.type === 'date' ? 'cursor-pointer' : ''}
                                            `}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    sendMessage(e);
                                                }
                                            }}
                                        />
                                        <div className="absolute top-1/2 -translate-y-1/2 left-0.5 w-[2px] h-0 bg-blue-500 group-focus-within:h-6 transition-all duration-300 rounded-full" />
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isTyping || isUploading || (!input.trim() && !selectedFile)}
                                className={`h-[52px] w-[52px] flex items-center justify-center rounded-2xl shadow-lg transition-all active:scale-90 shrink-0 ${
                                    isTyping || isUploading || (!input.trim() && !selectedFile)
                                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700/50'
                                        : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:shadow-blue-500/25 hover:-translate-y-0.5 border border-white/10'
                                }`}
                            >
                                {isUploading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send size={20} className={!input.trim() && !selectedFile ? 'opacity-40' : 'opacity-100'} />
                                )}
                            </button>
                        </div>

                        {/* Input type hint */}
                        {currentCaptureMapping && !isWaitingForFile && (
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest pl-1 mt-1">
                                {currentCaptureMapping === 'name' && "✏️ Enter Full Name"}
                                {currentCaptureMapping === 'phone' && "📞 10-Digit Mobile"}
                                {currentCaptureMapping === 'location' && "📍 Area / City (Letters)"}
                                {currentCaptureMapping === 'email' && "📧 Valid Email"}
                                {currentCaptureMapping === 'demo_date' && "📅 Pick a Date"}
                            </p>
                        )}
                    </form>
                )}
            </footer>
        </div>
    );
};

export default UserChat;
