import { useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import UserChat from '../components/UserChat';

const Widget = () => {
    const [guestUser, setGuestUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const initGuest = async () => {
        try {
            setLoading(true);
            const savedStr = localStorage.getItem('abm_guest_profile');
            if (savedStr) {
                const saved = JSON.parse(savedStr);
                if (saved && saved.token) {
                    setGuestUser(saved);
                    setLoading(false);
                    return;
                }
            }
            
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/guest`);
            localStorage.setItem('abm_guest_profile', JSON.stringify(data));
            setGuestUser(data);
            
        } catch (err) {
            console.error("Failed to initialize guest session:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initGuest();

        const handleSessionExpired = () => {
            console.log("Guest session expired. Re-initializing...");
            handleResetGuest();
        };

        window.addEventListener('widget-session-expired', handleSessionExpired);
        return () => window.removeEventListener('widget-session-expired', handleSessionExpired);
    }, []);

    const handleResetGuest = () => {
        localStorage.removeItem('abm_guest_profile');
        setGuestUser(null);
        initGuest();
    };

    if (loading || !guestUser) {
        return (
            <div className="w-full h-screen bg-transparent flex items-center justify-center">
                 <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user: guestUser, logout: handleResetGuest }}>
            <div className="w-full h-screen bg-transparent overflow-hidden">
                <UserChat isEmbedded={true} />
            </div>
        </AuthContext.Provider>
    );
};

export default Widget;
