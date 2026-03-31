import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { subscribeUserToPush } from '../utils/pushHelper';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        let parsedUser = null;
        if (userInfo) {
            parsedUser = JSON.parse(userInfo);
            setUser(parsedUser);
            // Immediately run push prompt on established saved session
            subscribeUserToPush(parsedUser.token);
        }
        setLoading(false);
    }, []);

    const login = async (phone, password) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, { phone, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            subscribeUserToPush(data.token);
            navigate('/dashboard');
        } catch (error) {
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const register = async (name, phone, password, role) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, { name, phone, password, role });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            subscribeUserToPush(data.token);
            navigate('/dashboard');
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
