import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Login({ setToken, setUser }) {
    const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        degree: '',
        academicYear: '',
        domain: '',
    });
    const [error, setError] = useState('');
    const [signupDomains, setSignupDomains] = useState([]);

    useEffect(() => {
        if (activeTab === 'signup') {
            fetchDomains();
        }
    }, [activeTab]);

    const fetchDomains = async () => {
        try {
            const res = await axios.get('/api/user/domains');
            setSignupDomains(res.data);
        } catch (err) {
            console.error("Failed to fetch domains", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const isSignup = activeTab === 'signup';
            const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
            const response = await axios.post(endpoint, formData);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            setToken(response.data.token);
            setUser(response.data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-container">
                <div className="card login-card">
                    <div className="card-body">
                        {/* Brand Header */}
                        <div className="brand-header">
                            <div className="brand-icon">💡</div>
                            <h1 className="brand-title">SkillWill</h1>
                            <p className="brand-subtitle">Your Career Learning Companion</p>
                        </div>

                        {error && <div className="alert alert-danger mb-3">{error}</div>}

                        {/* Tabs */}
                        <ul className="nav nav-tabs justify-content-center" role="tablist">
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === 'login' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('login')}
                                >
                                    Login
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === 'signup' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('signup')}
                                >
                                    Sign Up
                                </button>
                            </li>
                        </ul>

                        {/* Form Content */}
                        <div className="tab-content">
                            <form onSubmit={handleSubmit}>
                                {activeTab === 'signup' && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">Full Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="name"
                                                placeholder="Enter your full name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Degree</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="degree"
                                                placeholder="e.g., B.Tech, MBA"
                                                value={formData.degree}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Academic Year</label>
                                            <select
                                                className="form-control"
                                                name="academicYear"
                                                value={formData.academicYear}
                                                onChange={handleChange}
                                            >
                                                <option>Select Academic Year</option>
                                                <option>1st Year</option>
                                                <option>2nd Year</option>
                                                <option>3rd Year</option>
                                                <option>4th Year</option>
                                                <option>Graduated</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Domain</label>
                                            <select
                                                className="form-control"
                                                name="domain"
                                                value={formData.domain}
                                                onChange={handleChange}
                                            >
                                                <option>Select Your Domain</option>
                                                {signupDomains.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                                <option>Other</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="mb-3">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        placeholder={activeTab === 'signup' ? "Create a password" : "Enter your password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {activeTab === 'login' && (
                                    <div className="mb-3 form-check">
                                        <input type="checkbox" className="form-check-input" id="remember" />
                                        <label className="form-check-label" htmlFor="remember">Remember me</label>
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary w-100">
                                    {activeTab === 'login' ? (
                                        <><span className="me-2">🔓</span> Login</>
                                    ) : (
                                        <><span className="me-2">✨</span> Create Account</>
                                    )}
                                </button>
                            </form>

                            {activeTab === 'login' && (
                                <div className="demo-credentials mt-3">
                                    <strong>Demo Admin Credentials:</strong>
                                    Email: admin@skillwill.com<br />
                                    Password: Admin@123
                                </div>
                            )}
                        </div>

                        <div className="text-center mt-3 small">
                            By signing up, you agree to our <a href="#" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Privacy Policy</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
