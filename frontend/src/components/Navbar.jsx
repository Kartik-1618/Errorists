export default function Navbar({ user, onLogout }) {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark navbar-custom">
            <div className="container-fluid">
                <span className="navbar-brand">
                    <img src="/logo.png" alt="Logo" />
                    SkillWill
                    {user?.role === 'admin' && <span className="badge-admin">ADMIN</span>}
                </span>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <span className="nav-link">👤 {user?.name || 'User'}</span>
                        </li>
                        <li className="nav-item">
                            <button className="btn btn-outline-light btn-sm ms-2" onClick={onLogout}>
                                Logout
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
