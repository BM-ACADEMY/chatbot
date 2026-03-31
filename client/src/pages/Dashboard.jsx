import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import UserChat from '../components/UserChat';
import AdminDashboard from '../components/AdminDashboard';

const Dashboard = () => {
    const { user } = useContext(AuthContext);

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans">
            {user.role === 'admin' ? <AdminDashboard /> : <UserChat />}
        </div>
    );
};

export default Dashboard;
