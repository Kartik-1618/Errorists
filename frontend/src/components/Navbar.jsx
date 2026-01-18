import { Link } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
    return (
        <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
            <div className="container">
                <Link to="/" className="navbar-brand">
                    <img src="/logo.png" alt="SkillWill" height="32" />
                    <span>SkillWill</span>
                    {user?.role === 'admin' && <span className="badge-admin">ADMIN PANEL</span>}
                </Link>

                <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto align-items-center">
                        <li className="nav-item me-3">
                            <Link to="/profile" className="nav-link d-flex align-items-center gap-2">
                                <div className="avatar-circle">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <span>{user?.name || 'User'}</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <button className="btn btn-danger btn-sm px-3" onClick={onLogout}>
                                Logout
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
