import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function UserProfile({ user }) {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        name: '',
        degree: '',
        academicYear: '',
        domain: '',
        email: ''
    });
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [passMessage, setPassMessage] = useState('');
    const [passError, setPassError] = useState('');

    const token = localStorage.getItem('token');

    const [availableDomains, setAvailableDomains] = useState([]);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        loadProfileAndDomains();
    }, [token]);

    const loadProfileAndDomains = async () => {
        try {
            const [profileRes, rolesRes] = await Promise.all([
                axios.get('/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('/api/user/roles', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const p = profileRes.data;
            if (p) {
                setProfile({
                    name: p.name || '',
                    degree: p.degree || '',
                    academicYear: p.academicYear || '',
                    domain: p.domain || '',
                    email: p.email || ''
                });
            } else {
                // Token implies a user ID that doesn't exist (Zombie Session)
                console.error("User profile not found in DB. Session invalid.");
                // We set a specific error state instead of auto-redirecting, 
                // so the user understands WHY they need to login again.
                setError('SESSION_EXPIRED');
                setLoading(false);
                return;
            }

            // Robust check for roles array
            let uniqueDomains = [];
            if (Array.isArray(rolesRes.data)) {
                uniqueDomains = [...new Set(rolesRes.data.map(r => r.domain).filter(Boolean))].sort();
            }
            setAvailableDomains(uniqueDomains);

        } catch (err) {
            console.error("Profile load error:", err);
            if (err.response && err.response.status === 404) {
                // User endpoint returned 404
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            // Don't show error to user immediately if partial data loaded, just log it.
            if (!profile.email) {
                setError('Failed to load profile data. Please try refreshing or logging in again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await axios.put('/api/user/profile', profile, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage('Profile updated successfully!');
            // Update local storage user generic info if needed, but dashboard reloads it anyway
        } catch (err) {
            console.error(err);
            setError('Failed to update profile.');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPassMessage('');
        setPassError('');

        if (passwords.newPassword !== passwords.confirmPassword) {
            setPassError('New passwords do not match.');
            return;
        }

        try {
            await axios.put('/api/user/change-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPassMessage('Password changed successfully!');
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            setPassError(err.response?.data?.error || 'Failed to change password.');
        }
    };

    if (loading) return <div className="container mt-5 text-center"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container container-main" style={{ maxWidth: '900px' }}>
            <h2 className="mb-4" style={{ fontWeight: 700, color: '#2c3e50' }}>👤 My Profile</h2>

            <div className="row">
                {/* Left Column: Personal Details */}
                <div className="col-md-7 mb-4">
                    <div className="card h-100">
                        <div className="card-header card-header-custom">
                            📝 Edit Personal Details
                        </div>
                        <div className="card-body p-4">
                            {message && <div className="alert alert-success">{message}</div>}

                            {/* Special Session Expired Handling */}
                            {error === 'SESSION_EXPIRED' ? (
                                <div className="text-center py-5">
                                    <h4 className="text-danger mb-3">⚠️ Session Expired</h4>
                                    <p className="text-muted mb-4">
                                        Your session is no longer valid (likely due to a system update).<br />
                                        Please log in again to access your profile.
                                    </p>
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={() => {
                                            localStorage.removeItem('token');
                                            localStorage.removeItem('user');
                                            window.location.href = '/login';
                                        }}
                                    >
                                        Log In Again
                                    </button>
                                </div>
                            ) : (
                                error && <div className="alert alert-danger">{error}</div>
                            )}

                            {error !== 'SESSION_EXPIRED' && (
                                <form onSubmit={handleProfileUpdate}>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold">Email Address (Read Only)</label>
                                        <input type="text" className="form-control bg-light" value={profile.email} disabled />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={profile.name}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {user?.role !== 'admin' && (
                                        <>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Degree</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={profile.degree}
                                                        onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Academic Year</label>
                                                    <select
                                                        className="form-select"
                                                        value={profile.academicYear}
                                                        onChange={(e) => setProfile({ ...profile, academicYear: e.target.value })}
                                                    >
                                                        <option value="">Select Year</option>
                                                        <option value="1st Year">1st Year</option>
                                                        <option value="2nd Year">2nd Year</option>
                                                        <option value="3rd Year">3rd Year</option>
                                                        <option value="4th Year">4th Year</option>
                                                        <option value="Graduated">Graduated</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="form-label">Domain Of Interest</label>
                                                <select
                                                    className="form-select"
                                                    value={profile.domain}
                                                    onChange={(e) => setProfile({ ...profile, domain: e.target.value })}
                                                >
                                                    <option value="">Select Domain</option>
                                                    {availableDomains.length > 0 ? (
                                                        availableDomains.map(d => <option key={d} value={d}>{d}</option>)
                                                    ) : (
                                                        <option disabled>No domains found available</option>
                                                    )}
                                                    <option value="Other">Other</option>
                                                </select>
                                                <small className="text-muted">Changing this will update the recommended roles in your dashboard.</small>
                                            </div>
                                        </>
                                    )}

                                    <button type="submit" className="btn btn-primary w-100">Save Changes</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Password Change */}
                <div className="col-md-5 mb-4">
                    <div className="card">
                        <div className="card-header bg-danger text-white border-0" style={{ borderRadius: '12px 12px 0 0', padding: '1.5rem', fontWeight: 600 }}>
                            🔒 Change Password
                        </div>
                        <div className="card-body p-4">
                            {passMessage && <div className="alert alert-success">{passMessage}</div>}
                            {passError && <div className="alert alert-danger">{passError}</div>}

                            <form onSubmit={handlePasswordChange}>
                                <div className="mb-3">
                                    <label className="form-label">Current Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={passwords.oldPassword}
                                        onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">New Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-outline-danger w-100">Update Password</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
