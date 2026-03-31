import { Handle, Position, useConnection } from '@xyflow/react';
import { Bot, MessageSquare, FileText, MapPin, MoreHorizontal } from 'lucide-react';

const CustomNode = ({ data, selected }) => {
    const isStart = data.isStart || data.stepId === '1'; // Fallback to '1' for legacy
    const connection = useConnection();
    const isConnecting = connection.inProgress;

    const getIcon = () => {
        if (isStart) return <Bot className="text-emerald-400" size={14} />;
        if (data.captureType === 'file') return <FileText className="text-blue-400" size={14} />;
        if (data.captureMapping === 'address') return <MapPin className="text-orange-400" size={14} />;
        return <MessageSquare className="text-indigo-400" size={14} />;
    };

    const hasOptions = data.options && data.options.length > 0;

    return (
        <div
            style={{ minWidth: 240, maxWidth: 300 }}
            className={`
                bg-gray-900 border-2 rounded-2xl shadow-2xl transition-all duration-300 relative
                ${selected ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-gray-800 hover:border-gray-700'}
                ${isStart ? 'border-emerald-500/50' : ''}
            `}
        >
            {/* ── TARGET handle overlay — allows dropping a connection anywhere on the card ── */}
            {!isStart && (
                <Handle
                    type="target"
                    position={Position.Left}
                    id="target-in"
                    className={`absolute inset-0 w-full h-full !bg-transparent border-none transition-all ${isConnecting ? 'z-[100] cursor-crosshair' : 'z-0 pointer-events-none opacity-0'}`}
                />
            )}

            {/* ── VISUAL TARGET handle — visible guide dot ── */}
            {!isStart && (
                <Handle
                    type="target"
                    position={Position.Left}
                    id="target-in"
                    style={{
                        left: -10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#2563eb',
                        border: '3px solid #1e293b',
                        cursor: 'crosshair',
                        zIndex: 50,
                    }}
                />
            )}

            {/* ── HEADER ── */}
            <div className={`flex items-center justify-between p-3 border-b ${isStart ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-gray-800 bg-gray-800/30'} rounded-t-2xl`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isStart ? 'bg-emerald-500/10' : 'bg-gray-800 border border-gray-700'}`}>
                        {getIcon()}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {isStart ? 'Entry Point' : `Step ID: ${data.stepId}`}
                    </span>
                </div>
                <MoreHorizontal size={14} className="text-gray-600" />
            </div>

            {/* ── BODY ── */}
            <div className="p-4 space-y-3">
                <p className="text-xs text-gray-200 line-clamp-3 leading-relaxed font-medium">
                    {data.question || <span className="text-gray-600 italic">No question defined...</span>}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {data.captureMapping && (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[8px] font-black uppercase tracking-tighter">
                            Extract → {data.captureMapping}
                        </span>
                    )}
                    {data.assignmentAction && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-[8px] font-black uppercase tracking-tighter">
                            Route → {data.assignmentAction}
                        </span>
                    )}
                </div>
            </div>

            {/* ── PORTS / OPTIONS ── */}
            <div className="px-3 pb-3 space-y-2">
                {hasOptions ? (
                    data.options.map((opt, i) => (
                        <div key={i} className="relative">
                            <div className="bg-gray-950/50 border border-gray-800 px-3 py-2 rounded-xl text-[10px] text-gray-400 font-bold hover:border-blue-500/50 hover:text-white transition-all pr-8">
                                {opt.label}
                            </div>
                            {/* Source handle per button — right edge */}
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`handle-${i}`}
                                style={{
                                    right: -10,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    background: '#374151',
                                    border: '3px solid #1e293b',
                                    cursor: 'crosshair',
                                    zIndex: 50,
                                }}
                            />
                        </div>
                    ))
                ) : (
                    <div className="relative">
                        <div className="bg-gray-950/20 border border-dashed border-gray-800 px-3 py-2 rounded-xl text-[9px] text-gray-600 font-bold italic text-center pr-8">
                            Open Response
                        </div>
                        {/* Single source handle for open-response — right edge */}
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="handle-0"
                            style={{
                                right: -10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                background: '#374151',
                                border: '3px solid #1e293b',
                                cursor: 'crosshair',
                                zIndex: 50,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* ── SOURCE handle also at right of START node ── */}
            {isStart && (
                <Handle
                    type="source"
                    position={Position.Right}
                    id="handle-0"
                    style={{
                        right: -10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '3px solid #1e293b',
                        cursor: 'crosshair',
                        zIndex: 50,
                    }}
                />
            )}

            {/* Selection glow */}
            {selected && (
                <div className="absolute -inset-[2px] border-2 border-blue-500 rounded-2xl pointer-events-none animate-pulse" />
            )}
        </div>
    );
};

export default CustomNode;
