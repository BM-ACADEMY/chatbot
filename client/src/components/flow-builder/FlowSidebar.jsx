import { MessageSquare, PlusSquare, FileText, User, Phone, MapPin, Hash, Mail, Layers, Zap, Info } from 'lucide-react';

const FlowSidebar = () => {
    const onDragStart = (event, nodeType, defaults = {}) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-defaults', JSON.stringify(defaults));
        event.dataTransfer.effectAllowed = 'move';
    };

    const CategoryGroup = ({ title, items }) => (
        <div className="mb-8 last:mb-0">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 px-2">
                {title}
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="group relative flex flex-col items-center justify-center p-3 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-500/50 hover:bg-gray-800 transition-all cursor-grab active:cursor-grabbing hover:scale-[1.03] active:scale-95"
                        draggable
                        onDragStart={(event) => onDragStart(event, 'custom', item.defaults)}
                    >
                        <div className="p-2 mb-2 bg-gray-950 rounded-xl group-hover:bg-blue-500/10 transition-colors">
                            <item.icon size={18} className="text-gray-500 group-hover:text-blue-500" />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 group-hover:text-white uppercase tracking-tighter">
                            {item.label}
                        </span>
                        
                        {/* TOOLTIP ON HOVER */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-[8px] text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-gray-700 shadow-2xl z-50">
                            {item.desc}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const categories = [
        {
            title: 'Send Content',
            items: [
                { icon: MessageSquare, label: 'Text Msg', desc: 'Bot sends a standard message', defaults: { question: '👋 Hello! How can I help you today?', captureType: 'text' } },
                { icon: Info, label: 'Image/Media', desc: 'Bot sends rich media content', defaults: { question: 'Check this out!', captureType: 'text' } }
            ]
        },
        {
            title: 'Capture CRM Data',
            items: [
                { icon: User, label: 'Full Name', desc: 'Asks for name and saves to profile', defaults: { question: 'What is your full name?', captureMapping: 'name', captureType: 'text' } },
                { icon: Phone, label: 'Phone', desc: 'Asks for phone and saves to profile', defaults: { question: 'What is your contact number?', captureMapping: 'phone', captureType: 'text' } },
                { icon: MapPin, label: 'Address', desc: 'Asks for location/address', defaults: { question: 'Where are you located?', captureMapping: 'address', captureType: 'text' } },
                { icon: FileText, label: 'Document', desc: 'Requests a file/photo upload', defaults: { question: 'Please upload your ID or document here.', captureMapping: 'document', captureType: 'file' } }
            ]
        },
        {
            title: 'Interaction',
            items: [
                { icon: Zap, label: 'Quick Buttons', desc: 'Capture choice via buttons', defaults: { question: 'Choose an option below:', options: [{ label: 'Option 1', nextStep: '' }] } }
            ]
        }
    ];

    return (
        <aside className="w-full h-full bg-gray-950 border-r border-gray-800 flex flex-col shadow-2xl relative z-20">
            <header className="p-4 md:p-6 border-b border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shrink-0">
                        <Layers size={20} className="text-white" />
                    </div>
                    <h2 className="text-base md:text-lg font-black tracking-tighter text-white truncate">Neural Blocks</h2>
                </div>
                <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                    Drag and drop modules to construct intelligence.
                </p>
            </header>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {categories.map((cat, idx) => (
                    <CategoryGroup key={idx} {...cat} />
                ))}
            </div>

            <footer className="p-6 border-t border-gray-800 bg-gray-900/40">
                <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Zap size={14} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Pro Tip</p>
                        <p className="text-[9px] text-gray-500 font-medium leading-relaxed">Connect blocks to automate your business logic instantly.</p>
                    </div>
                </div>
            </footer>
        </aside>
    );
};

export default FlowSidebar;
