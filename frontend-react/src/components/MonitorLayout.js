import React from 'react';
import { NavLink } from 'react-router-dom';
import { CampusLensLogo } from './CollegePulseLogo';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiGlobe, FiAlertCircle } from 'react-icons/fi';
import UserDropdown from './UserDropdown';
import ProfileCard from './ProfileCard';
import BackButton from './BackButton';
import SessionNotifications from './SessionNotifications';

const monitorNav = [
    { to: '/monitor/dashboard', icon: <FiGrid size={16} />, label: 'Overview' },
    { to: '/monitor/domains', icon: <FiGlobe size={16} />, label: 'Domain Analytics' },
    { to: '/monitor/issues', icon: <FiAlertCircle size={16} />, label: 'Issue Tracker' },
];

const MonitorLayout = ({ children, title = 'Monitoring Dashboard' }) => {
    const { user } = useAuth();
    const roleLabel = user?.role === 'dean' ? 'Dean' : 'Principal';

    return (
        <div className="admin-layout">
            <SessionNotifications />
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
                <div className="sidebar-footer" style={{ padding: '1.5rem 0', borderTop: '1px solid var(--clr-border)' }}>
                    <ProfileCard variant="sidebar" />
                </div>
            </aside>
            <div className="main-content">
                <header className="topbar">
                    <span className="topbar-title">{title}</span>
                    <div className="topbar-right">
                        <BackButton />
                    </div>
                </header>
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MonitorLayout;
