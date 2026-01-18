import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';

function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (token) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } else {
            setUser(null);
        }
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    if (showSplash) {
        return (
            <div className="splash-screen">
                <img src="/logo.png" alt="SkillWill Logo" className="splash-logo" />
                <div className="splash-text">SkillWill</div>
            </div>
        );
    }

    return (
        <Router>
            <div className="App">
                {token && <Navbar user={user} onLogout={handleLogout} />}
                <Routes>
                    <Route
                        path="/login"
                        element={!token ? <Login setToken={setToken} setUser={setUser} /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/"
                        element={
                            token ? (
                                user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard user={user} />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/profile"
                        element={token ? <UserProfile user={user} /> : <Navigate to="/login" />}
                    />
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
