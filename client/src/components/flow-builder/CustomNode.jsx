import { Handle, Position } from '@xyflow/react';
import { Bot, MessageSquare, User, FileText, MapPin, Hash, Phone, Mail, MoreHorizontal } from 'lucide-react';

const CustomNode = ({ data, selected }) => {
    const isStart = data.stepId === '1';
    
    const getIcon = () => {
        if (isStart) return <Bot className="text-emerald-400" size={14} />;
        if (data.captureType === 'file') return <FileText className="text-blue-400" size={14} />;
        if (data.captureMapping === 'address') return <MapPin className="text-orange-400" size={14} />;
        return <MessageSquare className="text-indigo-400" size={14} />;
    };

    return (
        <div className={`
            min-w-[240px] max-w-[300px] bg-gray-900 border-2 rounded-2xl shadow-2xl transition-all duration-300
            ${selected ? 'border-blue-500 ring-4 ring-blue-500/20 scale-[1.02]' : 'border-gray-800 hover:border-gray-700'}
            ${isStart ? 'border-emerald-500/50' : ''}
        `}>
            {/* TARGET HANDLES (Input) */}
            {!isStart && (
                <>
                    {/* Global Catch-all Target (Allows dropping anywhere on card) */}
                    <Handle 
                        type="target" 
                        position={Position.Top} 
                        id="target-body"
                        className="absolute inset-0 w-full h-full !bg-transparent border-none z-0"
                    />

                    {/* Top Target Visual */}
                    <Handle 
                        type="target" 
                        position={Position.Top} 
                        id="target-top"
                        className="w-8 h-8 !bg-transparent border-none !-top-4 z-50 flex items-center justify-center group/handle"
                    >
                        <div className="w-3 h-3 bg-blue-600 border-2 border-gray-900 rounded-full group-hover/handle:scale-150 group-hover/handle:bg-blue-400 transition-all shadow-lg shadow-blue-500/20" />
                    </Handle>
                    
                    {/* Left Target Visual (for horizontal flows) */}
                    <Handle 
                        type="target" 
                        position={Position.Left} 
                        id="target-left"
                        className="w-8 h-8 !bg-transparent border-none !-left-4 z-50 flex items-center justify-center group/handle"
                        style={{ top: '50%', transform: 'translateY(-50%)' }}
                    >
                        <div className="w-3 h-3 bg-blue-600 border-2 border-gray-900 rounded-full group-hover/handle:scale-150 group-hover/handle:bg-blue-400 transition-all shadow-lg shadow-blue-500/20" />
                    </Handle>
                </>
            )}

            {/* HEADER */}
            <div className={`relative z-10 pointer-events-none flex items-center justify-between p-3 border-b ${isStart ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-gray-800 bg-gray-800/30'} rounded-t-2xl`}>
                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className={`p-1.5 rounded-lg ${isStart ? 'bg-emerald-500/10' : 'bg-gray-800 border border-gray-700 shadow-inner'}`}>
                        {getIcon()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {isStart ? 'Entry Point' : `Step ID: ${data.stepId}`}
                        </span>
                    </div>
                </div>
                <button className="pointer-events-auto text-gray-600 hover:text-white transition-colors">
                    <MoreHorizontal size={14} />
                </button>
            </div>

            {/* BODY */}
            <div className="relative z-10 pointer-events-none p-4 space-y-3">
                <p className="pointer-events-auto text-xs text-gray-200 line-clamp-3 leading-relaxed font-medium">
                    {data.question || <span className="text-gray-600 italic">No question defined...</span>}
                </p>

                {/* TAGS & ACTIONS */}
                <div className="flex flex-wrap gap-1.5 pointer-events-auto">
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

            {/* OPTIONS / PORTS */}
            <div className="relative z-10 pointer-events-none px-3 pb-3 space-y-2">
                {data.options && data.options.length > 0 ? (
                    data.options.map((opt, i) => (
                        <div key={i} className="relative group/opt pointer-events-auto">
                            <div className="bg-gray-950/50 border border-gray-800 px-3 py-2 rounded-xl text-[10px] text-gray-400 font-bold hover:border-blue-500/50 hover:text-white transition-all cursor-default">
                                {opt.label}
                            </div>
                            <Handle 
                                type="source" 
                                position={Position.Right} 
                                id={`handle-${i}`}
                                className="w-8 h-8 !bg-transparent border-none !-right-4 z-50 flex items-center justify-center group/handle"
                                style={{ top: '50%', transform: 'translateY(-50%)' }}
                            >
                                <div className="w-3 h-3 bg-gray-700 border-2 border-gray-900 rounded-full group-hover/handle:bg-blue-500 group-hover/handle:scale-150 transition-all shadow-lg shadow-blue-500/10" />
                            </Handle>
                        </div>
                    ))
                ) : (
                    <div className="relative group/opt pointer-events-auto">
                         <div className="bg-gray-950/20 border border-dashed border-gray-800 px-3 py-2 rounded-xl text-[9px] text-gray-600 font-bold italic text-center">
                            Open Response
                        </div>
                        <Handle 
                            type="source" 
                            position={Position.Right} 
                            id="handle-0"
                            className="w-8 h-8 !bg-transparent border-none !-right-4 z-50 flex items-center justify-center group/handle"
                            style={{ top: '50%', transform: 'translateY(-50%)' }}
                        >
                            <div className="w-3 h-3 bg-gray-700 border-2 border-gray-900 rounded-full group-hover/handle:bg-blue-500 group-hover/handle:scale-150 transition-all shadow-lg shadow-blue-500/10" />
                        </Handle>
                    </div>
                )}
            </div>

            {/* SELECTION INDICATOR */}
            {selected && (
                <div className="absolute -inset-[2px] border-2 border-blue-500 rounded-2xl pointer-events-none animate-pulse"></div>
            )}
        </div>
    );
};

export default CustomNode;
