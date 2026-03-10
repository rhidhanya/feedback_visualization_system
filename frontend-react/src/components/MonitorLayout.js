import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiGlobe, FiAlertCircle, FiLogOut } from 'react-icons/fi';
import { CampusLensLogo } from './CollegePulseLogo';
import { useAuth } from '../context/AuthContext';

const monitorNav = [
    { to: '/monitor/dashboard', icon: <FiGrid size={16} />, label: 'Overview' },
    { to: '/monitor/domains', icon: <FiGlobe size={16} />, label: 'Domain Analytics' },
    { to: '/monitor/issues', icon: <FiAlertCircle size={16} />, label: 'Issue Tracker' },
];

const MonitorLayout = ({ children, title = 'Monitoring Dashboard' }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/monitor-login'); };
    const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'M';
    const roleLabel = user?.role === 'dean' ? 'Dean' : 'Principal';

    return (
        <div className="admin-layout">
            <aside className="sidebar" id="monitor-sidebar">
                <div className="sidebar-logo">
                    <div className="brand">
                        <div className="brand-icon">
                            <CampusLensLogo iconSize={34} hideText />
                        </div>
                        <span className="brand-text">CampusLens</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-label">{roleLabel} Panel</div>
                        {monitorNav.map(item => (
                            <NavLink key={item.to} to={item.to}
                                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                                <span className="nav-icon">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </nav>
                <div className="sidebar-footer">
                    <button className="nav-item" style={{ color: '#ff4d4d' }} onClick={handleLogout}>
                        <span className="nav-icon"><FiLogOut size={16} /></span> Logout
                    </button>
                </div>
            </aside>
            <div className="main-content">
                <header className="topbar">
                    <span className="topbar-title">{title}</span>
                    <div className="topbar-right">
                        <div className="user-chip">
                            <div className="user-avatar" style={{ background: 'var(--clr-primary)' }}>{initials}</div>
                            <span>{user?.name}</span>
                            <span className="badge badge-primary">{roleLabel}</span>
                        </div>
                    </div>
                </header>
                <main className="page-content">{children}</main>
            </div>
        </div>
    );
};

export default MonitorLayout;
