import { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    if (!token) {
        return <Login setToken={setToken} setUser={setUser} />;
    }

    return (
        <div className="App">
            <Navbar user={user} onLogout={handleLogout} />
            {user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard user={user} />}
        </div>
    );
}

export default App;
