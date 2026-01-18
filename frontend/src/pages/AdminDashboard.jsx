import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [users, setUsers] = useState([]);
    const [allSkills, setAllSkills] = useState([]);
    const [allRoles, setAllRoles] = useState([]);

    // Form States
    const [newSkill, setNewSkill] = useState({ skillName: '', domain: '', relatedRole: '', difficulty: 'beginner' });
    const [newRole, setNewRole] = useState({ roleName: '', domain: '' });
    const [activeTab, setActiveTab] = useState('dashboard');

    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            loadDashboardData();
        }
    }, [token]);

    const loadDashboardData = async () => {
        try {
            const [dashRes, usersRes, skillsRes, rolesRes] = await Promise.all([
                axios.get('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('/api/admin/skills', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('/api/admin/roles', { headers: { 'Authorization': `Bearer ${token}` } }),
            ]);
            setDashboardData(dashRes.data);
            setUsers(usersRes.data);
            setAllSkills(skillsRes.data);
            setAllRoles(rolesRes.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };

    const addSkill = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/approve-skill', newSkill, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setNewSkill({ skillName: '', domain: '', relatedRole: '', difficulty: 'beginner' });
            loadDashboardData();
            alert('Skill added successfully!');
        } catch (error) {
            console.error('Error adding skill:', error);
            alert(error.response?.data?.error || 'Failed to add skill.');
        }
    };

    const addRole = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('/api/admin/add-role', newRole, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setNewRole({ roleName: '', domain: '' });
            loadDashboardData();
            alert(res.data.message || 'Role added successfully!');
        } catch (error) {
            console.error('Error adding role:', error);
            alert(error.response?.data?.error || 'Failed to add role.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid container-main">
            <div className="container">
                <h1 style={{ color: '#2c3e50', fontWeight: 700, marginBottom: '2rem' }}>⚙️ Admin Dashboard</h1>

                {/* Stats Row */}
                <div className="row mb-4">
                    <div className="col-md-4 mb-3">
                        <div className="stat-card-admin primary">
                            <div className="stat-number">{dashboardData?.totalUsers || 0}</div>
                            <div className="stat-label">📊 Total Users</div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="stat-card-admin success">
                            <div className="stat-number">{dashboardData?.totalSkills || 0}</div>
                            <div className="stat-label">💪 Skills in System</div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="stat-card-admin info">
                            <div className="stat-number">{dashboardData?.totalRoles || 0}</div>
                            <div className="stat-label">🎯 Roles Defined</div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <ul className="nav nav-tabs" role="tablist">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            📈 Dashboard
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'skills' ? 'active' : ''}`}
                            onClick={() => setActiveTab('skills')}
                        >
                            💪 Manage Skills
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'roles' ? 'active' : ''}`}
                            onClick={() => setActiveTab('roles')}
                        >
                            🎯 Manage Roles
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            👥 View Users
                        </button>
                    </li>
                </ul>

                {/* Tab Content */}
                <div className="tab-content">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <div className="row">
                            <div className="col-md-6 mb-4">
                                <div className="card">
                                    <div className="card-header card-header-admin">📊 System Overview</div>
                                    <div className="card-body">
                                        <p style={{ color: '#666', marginBottom: '15px' }}>
                                            Welcome to SkillWill Admin Panel. This is your central hub for managing the entire skill assessment platform.
                                        </p>
                                        <ul style={{ color: '#666', lineHeight: '1.8' }}>
                                            <li><strong>👥 Users:</strong> {dashboardData?.totalUsers} registered users actively using the platform</li>
                                            <li><strong>💪 Skills:</strong> {dashboardData?.totalSkills} skills tracked and managed in the system</li>
                                            <li><strong>🎯 Roles:</strong> {dashboardData?.totalRoles} career roles with defined skill requirements</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6 mb-4">
                                <div className="card">
                                    <div className="card-header card-header-admin">🔧 Quick Actions</div>
                                    <div className="card-body">
                                        <button className="btn btn-primary w-100 mb-2" onClick={() => setActiveTab('skills')}>➕ Add New Skill</button>
                                        <button className="btn btn-primary w-100 mb-2" onClick={() => setActiveTab('roles')}>➕ Add New Role</button>
                                        <button className="btn btn-primary w-100 mb-2" onClick={() => setActiveTab('users')}>👥 View Users</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manage Skills Tab */}
                    {activeTab === 'skills' && (
                        <div className="row">
                            <div className="col-md-4 mb-4">
                                <div className="card">
                                    <div className="card-header card-header-admin">➕ Add New Skill</div>
                                    <div className="card-body">
                                        <form onSubmit={addSkill}>
                                            <div className="mb-3">
                                                <label className="form-label">Skill Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="e.g., Machine Learning"
                                                    value={newSkill.skillName}
                                                    onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Related Role</label>
                                                <select
                                                    className="form-control"
                                                    value={newSkill.relatedRole}
                                                    onChange={(e) => {
                                                        const selectedRole = allRoles.find(r => r.roleName === e.target.value);
                                                        setNewSkill({
                                                            ...newSkill,
                                                            relatedRole: e.target.value,
                                                            domain: selectedRole ? selectedRole.domain : ''
                                                        });
                                                    }}
                                                >
                                                    <option value="">Select Role for Skill</option>
                                                    {allRoles.map((role) => (
                                                        <option key={role._id} value={role.roleName}>
                                                            {role.roleName} ({role.domain})
                                                        </option>
                                                    ))}
                                                </select>
                                                {allRoles.length === 0 && <small className="text-muted">Create a Role first.</small>}
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Difficulty Level</label>
                                                <select
                                                    className="form-control"
                                                    value={newSkill.difficulty}
                                                    onChange={(e) => setNewSkill({ ...newSkill, difficulty: e.target.value })}
                                                >
                                                    <option>beginner</option>
                                                    <option>intermediate</option>
                                                    <option>advanced</option>
                                                </select>
                                            </div>
                                            <button type="submit" className="btn btn-primary w-100">Add Skill</button>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-8 mb-4">
                                <div className="card">
                                    <div className="card-header card-header-admin">📋 Recent Skills</div>
                                    <div className="card-body table-responsive">
                                        <table className="table table-hover table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Skill Name</th>
                                                    <th>Related Role</th>
                                                    <th>Difficulty</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allSkills.slice(0, 10).map((skill, idx) => (
                                                    <tr key={idx}>
                                                        <td>{skill.skillName}</td>
                                                        <td>{skill.relatedRole || skill.domain || '-'}</td>
                                                        <td>
                                                            <span className={`badge bg-${skill.difficulty === 'beginner' ? 'success' : skill.difficulty === 'intermediate' ? 'warning' : 'danger'}`}>
                                                                {skill.difficulty}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {allSkills.length === 0 && <tr><td colSpan="3">No skills found.</td></tr>}
                                            </tbody>
                                        </table>
                                        {allSkills.length > 10 && <small className="text-muted">Showing 10 of {allSkills.length} skills</small>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manage Roles Tab */}
                    {activeTab === 'roles' && (
                        <div className="row">
                            <div className="col-md-4 mb-4">
                                <div className="card">
                                    <div className="card-header card-header-admin">➕ Add New Role</div>
                                    <div className="card-body">
                                        <form onSubmit={addRole}>
                                            <div className="mb-3">
                                                <label className="form-label">Role Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="e.g., Data Scientist"
                                                    value={newRole.roleName}
                                                    onChange={(e) => setNewRole({ ...newRole, roleName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Domain</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Select Domain"
                                                    value={newRole.domain}
                                                    onChange={(e) => setNewRole({ ...newRole, domain: e.target.value })}
                                                />
                                            </div>
                                            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                                {loading ? 'Creating & Generating Skills...' : 'Create Role'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-8 mb-4">
                                <div className="card">
                                    <div className="card-header card-header-admin">🎯 Defined Roles</div>
                                    <div className="card-body table-responsive">
                                        <table className="table table-hover table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Role Name</th>
                                                    <th>Domain</th>
                                                    <th>Skills Req.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allRoles.slice(0, 10).map((role, idx) => (
                                                    <tr key={idx}>
                                                        <td>{role.roleName}</td>
                                                        <td>{role.domain}</td>
                                                        <td>{role.requiredSkills?.length || 0}</td>
                                                    </tr>
                                                ))}
                                                {allRoles.length === 0 && <tr><td colSpan="3">No roles found.</td></tr>}
                                            </tbody>
                                        </table>
                                        {allRoles.length > 10 && <small className="text-muted">Showing 10 of {allRoles.length} roles</small>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Users Tab */}
                    {activeTab === 'users' && (
                        <div className="card">
                            <div className="card-header card-header-admin">👥 All Registered Users</div>
                            <div className="card-body">
                                {users?.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Domain</th>
                                                    <th>Goal Role</th>
                                                    <th>Readiness</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((u, idx) => (
                                                    <tr key={idx}>
                                                        <td>{u.name}</td>
                                                        <td>{u.email}</td>
                                                        <td>{u.domain}</td>
                                                        <td>{u.goalRole || '-'}</td>
                                                        <td>
                                                            <div className="progress" style={{ height: '20px', width: '100px' }}>
                                                                <div
                                                                    className="progress-bar"
                                                                    style={{
                                                                        width: `${u.readiness}%`,
                                                                        backgroundColor: u.readiness > 70 ? 'var(--success-color)' : u.readiness > 40 ? 'var(--warning-color)' : 'var(--primary-color)'
                                                                    }}
                                                                >
                                                                    {u.readiness}%
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-muted">No users found.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
