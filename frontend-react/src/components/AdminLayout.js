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
                    <div className="brand">
                        <div className="brand-icon">
                            <CampusLensLogo iconSize={36} hideText />
                        </div>
                        <span className="brand-text">CampusLens</span>
                    </div>
                </div>

                <nav className="sidebar-nav" style={{ padding: '0 1rem' }}>
                    <div className="nav-section" style={{ marginBottom: '1.5rem' }}>
                        <div className="nav-label" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.75rem 0.75rem' }}>Main</div>
                        {adminNavMain.map(item => (
                            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ marginBottom: '0.5rem' }}>
                                <span className="nav-icon">{item.icon}</span>{item.label}
                            </NavLink>
                        ))}
                    </div>
                    {showManagement && (
                        <div className="nav-section">
                            <div className="nav-label" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.75rem 0.75rem' }}>Management</div>
                            {adminNavManage.map(item => (
                                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ marginBottom: '0.5rem' }}>
                                    <span className="nav-icon">{item.icon}</span>{item.label}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer" style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--clr-border)' }}>
                    <button
                        id="logout-btn"
                        className="nav-item"
                        style={{ color: '#e57373', width: '100%', background: 'rgba(211, 47, 47, 0.05)' }}
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
                        <div className="user-chip" style={{ background: 'rgba(229, 222, 210, 0.1)', border: '1px solid var(--clr-border)', color: 'var(--clr-text)' }}>
                            <div className="user-avatar" style={{ background: 'var(--clr-surface)', color: 'var(--clr-primary)' }}>{initials}</div>
                            <span style={{ fontWeight: 600 }}>{user?.name}</span>
                            <span className="badge badge-primary">
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
