import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Hide back button if we're on the login page or have no history (optional, but let's see)
    // Actually, user said "each page", so I'll keep it simple but make it look good.
    
    // We can hide it on login/register if we want, but "each page" is explicit.
    // However, clicking back on login might be weird if there's no history.
    
    const handleBack = () => {
        navigate(-1);
    };

    return (
        <button
            onClick={handleBack}
            className="fixed top-6 left-6 z-[100] flex items-center justify-center p-3 rounded-2xl bg-gray-900/40 backdrop-blur-xl border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-all duration-300 group shadow-2xl hover:shadow-blue-500/10 active:scale-95"
            aria-label="Go back"
        >
            <ArrowLeft size={20} className="transform transition-transform group-hover:-translate-x-1" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 text-sm font-medium whitespace-nowrap">
                Back
            </span>
        </button>
    );
};

export default BackButton;
