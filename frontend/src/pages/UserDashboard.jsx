import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserDashboard({ user }) {
    const [profile, setProfile] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [progress, setProgress] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);

    // Form States
    const [newSkill, setNewSkill] = useState('');
    const [newSkillProficiency, setNewSkillProficiency] = useState('beginner');
    const [goalRole, setGoalRole] = useState('');

    // Completion Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [completionNote, setCompletionNote] = useState('');
    const [noteError, setNoteError] = useState('');

    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            loadUserData();
        }
    }, [token]);

    const loadUserData = async () => {
        try {
            const [profileRes, recsRes, progRes, rolesRes] = await Promise.all([
                axios.get('/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('/api/user/recommendations', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('/api/user/progress', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('/api/user/roles', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            setProfile(profileRes.data);
            setRecommendations(recsRes.data);
            setProgress(progRes.data);
            setAvailableRoles(rolesRes.data);
            setGoalRole(profileRes.data.goalRole || '');
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addSkill = async (e) => {
        e.preventDefault();
        if (!newSkill.trim()) return;

        try {
            await axios.post(
                '/api/user/skills',
                {
                    skillName: newSkill,
                    proficiency: newSkillProficiency,
                    yearsOfExperience: newSkillProficiency === 'beginner' ? 0 : 2, // Approximate
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setNewSkill('');
            setNewSkillProficiency('beginner');
            loadUserData();
        } catch (error) {
            console.error('Error adding skill:', error);
            alert('Failed to add skill. Please try again.');
        }
    };

    const updateGoalRole = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.put(
                '/api/user/profile',
                { goalRole },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            // Immediate update from response
            setProfile(res.data.user);
            setRecommendations(res.data.recommendations);

            // Reload all data to ensure Roles are updated if AI generated them
            await loadUserData();

            alert('Goal updated successfully!');
        } catch (error) {
            console.error('Error updating goal:', error);
            alert('Error updating goal');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCompletionModal = (skillName) => {
        setSelectedSkill(skillName);
        setCompletionNote('');
        setNoteError('');
        setShowModal(true);
    };

    const submitCompletion = async () => {
        if (!completionNote.trim()) {
            setNoteError('Please enter a note about your completion (e.g., Course name, Project URL).');
            return;
        }

        try {
            const res = await axios.post(
                '/api/user/progress',
                {
                    skillName: selectedSkill,
                    action: `Completed ${selectedSkill}`,
                    certificateUrl: '',
                    notes: completionNote,
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            // Immediate update
            setProfile(res.data.user);
            setRecommendations(res.data.recommendations);
            loadUserData(); // To update history list
            setShowModal(false);
            setSelectedSkill(null);
            setCompletionNote('');
        } catch (error) {
            console.error('Error logging progress:', error);
            if (error.response?.data?.error) {
                alert(error.response.data.error); // Show backend Dup error if any
            }
        }
    };

    if (loading) return <div className="container mt-5 text-center"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container-fluid container-main">
            {/* Modal Overlay */}
            {showModal && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">🎉 Mark "{selectedSkill}" as Complete</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-2">Great job! Briefly describe how you achieved this (e.g., completed a course, built a project).</p>
                                <textarea
                                    className={`form-control ${noteError ? 'is-invalid' : ''}`}
                                    rows="3"
                                    placeholder="Enter your completion notes..."
                                    value={completionNote}
                                    onChange={(e) => setCompletionNote(e.target.value)}
                                ></textarea>
                                {noteError && <div className="invalid-feedback">{noteError}</div>}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-success" onClick={submitCompletion}>Confirm Completion</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container">
                {/* Header */}
                <div className="row mb-4">
                    <div className="col-md-8">
                        <h1 style={{ color: '#2c3e50', fontWeight: 700 }}>🎯 Welcome, {profile?.name}!</h1>
                        <p style={{ color: '#666', marginBottom: 0 }}>Your personalized skill development journey</p>
                    </div>
                    <div className="col-md-4">
                        <div className="readiness-box">
                            <div className="readiness-value">{profile?.readiness || 0}%</div>
                            <div className="readiness-label">Goal Readiness</div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="icon-box">💪</div>
                        <div className="stat-number">{profile?.currentSkills?.length || 0}</div>
                        <div className="stat-label">Skills Added</div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-box">🚀</div>
                        <div className="stat-number">{recommendations?.length || 0}</div>
                        <div className="stat-label">Pending Recommendations</div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-box">✅</div>
                        <div className="stat-number">{progress?.length || 0}</div>
                        <div className="stat-label">Skills Completed</div>
                    </div>
                </div>

                {/* Main Content Row */}
                <div className="row">
                    {/* Set Goal Role */}
                    <div className="col-md-4 mb-4">
                        <div className="card">
                            <div className="card-header card-header-custom">
                                🎯 Your Goal Role
                            </div>
                            <div className="card-body">
                                <form onSubmit={updateGoalRole}>
                                    <div className="mb-3">
                                        <label className="form-label">Target Role</label>
                                        {profile?.domain && (
                                            <small className="text-muted d-block mb-1">
                                                Recommended for your domain: <strong>{profile.domain}</strong>
                                            </small>
                                        )}
                                        <select
                                            className="form-control"
                                            value={goalRole}
                                            onChange={(e) => setGoalRole(e.target.value)}
                                        >
                                            <option value="">Select Target Role</option>
                                            {availableRoles
                                                .filter(role => !profile?.domain || (role.domain && role.domain.toLowerCase() === profile.domain.toLowerCase()))
                                                .sort((a, b) => a.roleName.localeCompare(b.roleName)) // Alphabetical sort
                                                .map((role) => (
                                                    <option key={role._id} value={role.roleName}>
                                                        {role.roleName}
                                                    </option>
                                                ))}
                                        </select>
                                        {profile?.domain && availableRoles.filter(role => role.domain && role.domain.toLowerCase() === profile.domain.toLowerCase()).length === 0 && (
                                            <div className="text-danger small mt-1">
                                                No roles found for this domain yet.
                                            </div>
                                        )}
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100">Update Goal</button>
                                </form>
                                <hr />
                                <small style={{ color: '#666' }}>
                                    <strong>Current Goal:</strong><br />
                                    {profile?.goalRole || 'Not Set'}<br />
                                    <small style={{ color: '#999' }}>Set on {new Date().toLocaleDateString()}</small>
                                </small>
                            </div>
                        </div>
                    </div>

                    {/* Add Skills */}
                    <div className="col-md-4 mb-4">
                        <div className="card">
                            <div className="card-header card-header-custom">
                                💪 Add Your Skills
                            </div>
                            <div className="card-body">
                                <form onSubmit={addSkill}>
                                    <div className="mb-3">
                                        <label className="form-label">Skill Name</label>
                                        <select
                                            className="form-control"
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            disabled={!goalRole} // Disable if no goal set
                                        >
                                            <option value="">Select a Skill</option>

                                            {/* Filter available roles to find the selected goal, then map its required skills */}
                                            {availableRoles.find(r => r.roleName === goalRole)?.requiredSkills?.map((skill, idx) => (
                                                <option key={idx} value={skill.skillName}>
                                                    {skill.skillName}
                                                </option>
                                            ))}

                                            {(!goalRole || !availableRoles.find(r => r.roleName === goalRole)?.requiredSkills?.length) && (
                                                <option value="" disabled>Select a Goal Role first</option>
                                            )}
                                        </select>
                                        {goalRole && (
                                            <small className="text-muted">Skills recommended for {goalRole}</small>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Proficiency</label>
                                        <select
                                            className="form-control"
                                            value={newSkillProficiency}
                                            onChange={(e) => setNewSkillProficiency(e.target.value)}
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn btn-success w-100">Add Skill</button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* My Skills */}
                    <div className="col-md-4 mb-4">
                        <div className="card">
                            <div className="card-header card-header-custom">
                                📋 My Skills ({profile?.currentSkills?.length || 0})
                            </div>
                            <div className="card-body" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {profile?.currentSkills?.map((skill, idx) => {
                                        let badgeClass = 'bg-secondary';
                                        if (skill.proficiency.toLowerCase() === 'advanced') badgeClass = 'bg-success';
                                        if (skill.proficiency.toLowerCase() === 'intermediate') badgeClass = 'bg-primary';

                                        return (
                                            <span key={idx} className={`badge ${badgeClass} p-2`} style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                                {skill.skillName} <small className="opacity-75" style={{ fontSize: '0.7em', marginLeft: '4px' }}>{skill.proficiency}</small>
                                            </span>
                                        );
                                    })}
                                    {(!profile?.currentSkills || profile.currentSkills.length === 0) && (
                                        <p className="text-muted small">No skills added yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="row">
                    <div className="col-md-12 mb-4">
                        <h3 style={{ color: '#2c3e50', fontWeight: 700, marginBottom: '1.5rem' }}>🚀 Your Next Learning Steps</h3>

                        {recommendations?.length > 0 ? (
                            recommendations.map((rec, idx) => {
                                const isCompleted = rec.status === 'completed';
                                return (
                                    <div key={idx} className="recommendation-card" style={isCompleted ? { borderLeft: '5px solid var(--success-color)', backgroundColor: '#f8fff9' } : {}}>
                                        <div className="recommendation-priority">Priority: {rec.priority >= 4 ? 'High' : 'Medium'}</div>
                                        <h5 style={{ color: isCompleted ? 'var(--success-color)' : 'var(--primary-color)', marginBottom: '10px' }}>
                                            {rec.skillName} {isCompleted && '✅'}
                                        </h5>
                                        <p style={{ color: '#666', marginBottom: '10px' }}>
                                            <strong>Why:</strong> {rec.learningAction}
                                        </p>
                                        {!isCompleted && (
                                            <p style={{ color: '#666', marginBottom: '10px' }}>
                                                <strong>Estimated Days:</strong> {rec.estimatedDays}
                                            </p>
                                        )}

                                        {!isCompleted ? (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-primary me-2"
                                                    onClick={() => window.open(`https://www.google.com/search?q=Learn+${rec.skillName}`, '_blank')}
                                                >
                                                    Start Learning
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => handleOpenCompletionModal(rec.skillName)}
                                                >
                                                    Mark Complete
                                                </button>
                                            </>
                                        ) : (
                                            <span className="badge bg-success">Completed</span>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="alert alert-info">
                                No specific recommendations yet. Set your goal role and add skills to get started!
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress History */}
                <div className="row">
                    <div className="col-md-12">
                        <h3 style={{ color: '#2c3e50', fontWeight: 700, marginBottom: '1.5rem' }}>📈 Your Progress History</h3>

                        {progress?.length > 0 ? (
                            progress.map((p, idx) => (
                                <div key={idx} className="progress-item">
                                    <h6 style={{ color: 'var(--success-color)', margin: '0 0 5px 0' }}>✅ {p.skillName}</h6>
                                    {p.notes && (
                                        <p style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic', margin: '5px 0' }}>
                                            "{p.notes}"
                                        </p>
                                    )}
                                    <small style={{ color: '#999' }}>Completed on {new Date(p.completionDate || p.createdAt).toLocaleDateString()}</small>
                                </div>
                            ))
                        ) : (
                            <div className="alert alert-secondary">
                                No progress recorded yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
