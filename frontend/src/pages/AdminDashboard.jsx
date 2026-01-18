import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [users, setUsers] = useState([]);
    const [allSkills, setAllSkills] = useState([]);
    const [allRoles, setAllRoles] = useState([]);

    // Form States
    const [newSkill, setNewSkill] = useState({ id: null, skillName: '', domain: '', relatedRole: '', difficulty: 'beginner' });
    const [newRole, setNewRole] = useState({ roleName: '', domain: '' });
    const [activeTab, setActiveTab] = useState('dashboard');

    // Skill Management States
    // Skill Management States
    const [skillFilterRole, setSkillFilterRole] = useState('');
    const [skillFilterDomain, setSkillFilterDomain] = useState('');
    const [skillPage, setSkillPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Derived Logic
    const uniqueDomains = [...new Set(allRoles.map(r => r.domain).filter(Boolean))].sort();

    const filteredSkills = allSkills.filter(s =>
        (!skillFilterRole || s.relatedRole === skillFilterRole) &&
        (!skillFilterDomain || s.domain === skillFilterDomain)
    );
    const totalSkillPages = Math.ceil(filteredSkills.length / ITEMS_PER_PAGE);
    const paginatedSkills = filteredSkills.slice((skillPage - 1) * ITEMS_PER_PAGE, skillPage * ITEMS_PER_PAGE);

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
            const res = await axios.post('/api/admin/approve-skill', { ...newSkill }, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const savedSkill = res.data.skill;

            // Update table locally to show latest first
            setAllSkills(prev => [savedSkill, ...prev.filter(s => s._id !== savedSkill._id)]);

            setNewSkill({ id: null, skillName: '', domain: '', relatedRole: '', difficulty: 'beginner' });

            // loadDashboardData(); // Optional: We updated local state manually for better UX
            alert(res.data.message || 'Skill processed successfully!');
        } catch (error) {
            console.error('Error adding/updating skill:', error);
            alert(error.response?.data?.error || 'Failed to process skill.');
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

    const deleteSkillHandler = async (e, id) => {
        e.stopPropagation(); // Prevent row click
        if (window.confirm('Are you sure you want to delete this skill?')) {
            try {
                await axios.delete(`/api/admin/skill/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setAllSkills(prev => prev.filter(s => s._id !== id));
                if (newSkill.id === id) {
                    setNewSkill({ id: null, skillName: '', domain: '', relatedRole: '', difficulty: 'beginner' });
                }
            } catch (error) {
                console.error("Failed to delete", error);
                alert("Failed to delete skill.");
            }
        }
    };

    const deleteRoleHandler = async (e, id, roleName) => {
        e.stopPropagation();
        if (window.confirm(`WARNING: Deleting role '${roleName}' will ALSO DELETE ALL associated skills.\n\nAre you sure you want to proceed?`)) {
            try {
                await axios.delete(`/api/admin/role/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setAllRoles(prev => prev.filter(r => r._id !== id));
                setAllSkills(prev => prev.filter(s => s.relatedRole !== roleName));
                alert(`Role '${roleName}' and associated skills were deleted.`);
            } catch (error) {
                console.error("Failed to delete Role", error);
                alert("Failed to delete Role.");
            }
        }
    };

    const deleteUserHandler = async (e, id, userName) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete user '${userName}'?\n\nThis will permanently remove their account and ALL progress history.`)) {
            try {
                await axios.delete(`/api/admin/user/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setUsers(prev => prev.filter(u => u._id !== id));
                alert(`User '${userName}' deleted successfully.`);
            } catch (error) {
                console.error("Failed to delete User", error);
                alert("Failed to delete User.");
            }
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
                                    <div className="card-header card-header-admin">
                                        {newSkill.id ? '✏️ Update Skill' : '➕ Add New Skill'}
                                        {newSkill.id && (
                                            <button
                                                className="btn btn-sm btn-outline-secondary float-end"
                                                onClick={() => setNewSkill({ id: null, skillName: '', domain: '', relatedRole: '', difficulty: 'beginner' })}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
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
                                            <button type="submit" className={`btn w-100 ${newSkill.id ? 'btn-warning' : 'btn-primary'}`}>
                                                {newSkill.id ? 'Update Skill' : 'Add Skill'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-8 mb-4">
                                <div className="card">
                                    <div className="card-header card-header-admin py-3">
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="fw-bold text-dark fs-6">📋 Managed Skills</span>
                                                <span className="badge bg-white text-secondary border rounded-pill shadow-sm small">
                                                    {filteredSkills.length} Total
                                                </span>
                                            </div>

                                            <div className="d-flex gap-2">
                                                <div className="input-group input-group-sm shadow-sm" style={{ maxWidth: '200px' }}>
                                                    <span className="input-group-text bg-white border-end-0 text-muted">🏢</span>
                                                    <select
                                                        className="form-select border-start-0 ps-0"
                                                        value={skillFilterDomain}
                                                        onChange={(e) => { setSkillFilterDomain(e.target.value); setSkillPage(1); }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <option value="">All Domains</option>
                                                        {uniqueDomains.map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                </div>

                                                <div className="input-group input-group-sm shadow-sm" style={{ maxWidth: '200px' }}>
                                                    <span className="input-group-text bg-white border-end-0 text-muted">👤</span>
                                                    <select
                                                        className="form-select border-start-0 ps-0"
                                                        value={skillFilterRole}
                                                        onChange={(e) => { setSkillFilterRole(e.target.value); setSkillPage(1); }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <option value="">All Roles</option>
                                                        {allRoles
                                                            .filter(r => !skillFilterDomain || r.domain === skillFilterDomain)
                                                            .map(r => <option key={r._id} value={r.roleName}>{r.roleName}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-body table-responsive">
                                        <table className="table table-hover table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Skill Name</th>
                                                    <th>Related Role</th>
                                                    <th>Difficulty</th>
                                                    <th className="text-center" style={{ width: '80px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedSkills.map((skill, idx) => (
                                                    <tr
                                                        key={skill._id || idx}
                                                        onClick={() => setNewSkill({
                                                            id: skill._id,
                                                            skillName: skill.skillName,
                                                            domain: skill.domain,
                                                            relatedRole: skill.relatedRole || '',
                                                            difficulty: skill.difficulty
                                                        })}
                                                        style={{ cursor: 'pointer', backgroundColor: newSkill.id === skill._id ? '#e8f0fe' : '' }}
                                                        title="Click to edit"
                                                    >
                                                        <td>{skill.skillName} {newSkill.id === skill._id && '✏️'}</td>
                                                        <td>{skill.relatedRole || skill.domain || '-'}</td>
                                                        <td>
                                                            <span className={`badge bg-${skill.difficulty === 'beginner' ? 'success' : skill.difficulty === 'intermediate' ? 'warning' : 'danger'}`}>
                                                                {skill.difficulty}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-sm btn-outline-danger py-0"
                                                                onClick={(e) => deleteSkillHandler(e, skill._id)}
                                                                title="Delete Skill"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {paginatedSkills.length === 0 && <tr><td colSpan="4" className="text-center">No skills found.</td></tr>}
                                            </tbody>
                                        </table>

                                        {/* Pagination */}
                                        {totalSkillPages > 1 && (
                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    disabled={skillPage === 1}
                                                    onClick={() => setSkillPage(p => p - 1)}
                                                >
                                                    Previous
                                                </button>
                                                <span className="small text-muted">Page {skillPage} of {totalSkillPages}</span>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    disabled={skillPage === totalSkillPages}
                                                    onClick={() => setSkillPage(p => p + 1)}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
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
                                                    <th className="text-center">Skills Req.</th>
                                                    <th className="text-center" style={{ width: '80px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allRoles.slice(0, 10).map((role, idx) => (
                                                    <tr key={role._id || idx}>
                                                        <td>{role.roleName}</td>
                                                        <td>{role.domain}</td>
                                                        <td className="text-center">{role.requiredSkills?.length || 0}</td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-sm btn-outline-danger py-0"
                                                                onClick={(e) => deleteRoleHandler(e, role._id, role.roleName)}
                                                                title="Delete Role & Skills"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {allRoles.length === 0 && <tr><td colSpan="4">No roles found.</td></tr>}
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
                                                    <th className="text-center" style={{ width: '80px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((u, idx) => (
                                                    <tr key={u._id || idx}>
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
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-sm btn-outline-danger py-0"
                                                                onClick={(e) => deleteUserHandler(e, u._id, u.name)}
                                                                title="Delete User"
                                                            >
                                                                🗑️
                                                            </button>
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
