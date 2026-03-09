import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiBarChart2, FiUsers, FiUserCheck, FiLogOut, FiUserPlus, FiBook, FiBell
} from 'react-icons/fi';
import { CampusLensLogo } from './CollegePulseLogo';
import { useAuth } from '../context/AuthContext';

const adminNavMain = [
    { to: '/admin/domain-overview', icon: <FiBarChart2 size={16} />, label: 'Domain Overview' },
];

const adminNavManage = [
    { to: '/admin/faculty-management', icon: <FiUserPlus size={16} />, label: 'Manage Faculties' },
    { to: '/admin/hod-management', icon: <FiUserCheck size={16} />, label: 'Manage HOD' },
    { to: '/admin/domain-heads', icon: <FiUserCheck size={16} />, label: 'Manage Incharges' },
    { to: '/admin/users', icon: <FiUsers size={16} />, label: 'Students' },
    { to: '/admin/subjects-management', icon: <FiBook size={16} />, label: 'Manage Subjects' },
    { to: '/admin/notifications', icon: <FiBell size={16} />, label: 'Notifications' },
];

const AdminLayout = ({ children, title = 'Dashboard', noSidebar = false }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/admin/login'); };
    const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD';
    
    // Show Management section only for admin
    const showManagement = user?.role === 'admin';

    return (
        <div className="admin-layout">
            {/* ── Sidebar ── */}
            {!noSidebar && (
            <aside className="sidebar" id="admin-sidebar">
                <div className="sidebar-logo">
                    <CampusLensLogo iconSize={34} />
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-label">Main</div>
                        {adminNavMain.map(item => (
                            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                                <span className="nav-icon">{item.icon}</span>{item.label}
                            </NavLink>
                        ))}
                    </div>
                    {showManagement && (
                        <div className="nav-section" style={{ marginTop: '1.25rem' }}>
                            <div className="nav-label">Management</div>
                            {adminNavManage.map(item => (
                                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                                    <span className="nav-icon">{item.icon}</span>{item.label}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <button
                        id="logout-btn"
                        className="nav-item"
                        style={{ color: 'var(--clr-danger)' }}
                        onClick={handleLogout}
                    >
                        <span className="nav-icon"><FiLogOut size={16} /></span> Logout
                    </button>
                </div>
            </aside>
            )}

            {/* ── Main ── */}
            <div className="main-content" style={noSidebar ? { marginLeft: 0, width: '100%' } : {}}>
                <header className="topbar">
                    <span className="topbar-title">{title}</span>
                    <div className="topbar-right">
                        <div className="user-chip">
                            <div className="user-avatar">{initials}</div>
                            <span>{user?.name}</span>
                            <span className="badge badge-primary" style={{ marginLeft: '0.25rem' }}>
                                {user?.role === 'dean' ? 'Dean' : user?.role === 'principal' ? 'Principal' : 'Admin'}
                            </span>
                        </div>
                    </div>
                </header>
                <main className="page-content">{children}</main>
            </div>
        </div>
    );
};

export default AdminLayout;
