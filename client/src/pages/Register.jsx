import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { User, Phone, Lock, Tag, AlertCircle } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(name, phone, password, role);
        } catch (err) {
            setError(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="max-w-md w-full space-y-6 bg-gray-900/60 backdrop-blur-2xl p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-gray-800 z-10 transition-all duration-300 hover:shadow-[0_0_60px_rgba(168,85,247,0.15)]">
                <div>
                    <div className="mx-auto h-20 w-20 bg-gradient-to-bl from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 hover:-rotate-3">
                        <User className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="mt-8 text-center text-3xl font-extrabold text-white tracking-tight">
                        Create an Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Join BMTechX to explore our services
                    </p>
                </div>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="flex items-center space-x-2 bg-red-900/40 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl">
                            <AlertCircle size={20} className="text-red-400 shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={20} />
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="appearance-none block w-full pl-12 pr-4 py-3 border border-gray-800 bg-gray-950/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all sm:text-sm"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={20} />
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                required
                                className="appearance-none block w-full pl-12 pr-4 py-3 border border-gray-800 bg-gray-950/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all sm:text-sm"
                                placeholder="Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={20} />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none block w-full pl-12 pr-4 py-3 border border-gray-800 bg-gray-950/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={20} />
                            <select
                                id="role"
                                className="appearance-none block w-full pl-12 pr-10 py-3 border border-gray-800 bg-gray-950/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all sm:text-sm"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="user" className="bg-gray-900 text-white">User</option>
                                <option value="admin" className="bg-gray-900 text-white">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900 transition-all transform hover:-translate-y-0.5 shadow-[0_10px_20px_rgba(168,85,247,0.2)] hover:shadow-[0_15px_30px_rgba(168,85,247,0.3)]"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>

                <div className="text-center pt-4 border-t border-gray-800">
                    <p className="text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-purple-500 hover:text-purple-400 transition-colors">
                            Sign in instead
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
