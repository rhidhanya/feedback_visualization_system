import React from 'react';
import { NavLink } from 'react-router-dom';
import { CampusLensLogo } from './CollegePulseLogo';
import { FiGrid, FiBell, FiAlertTriangle, FiHelpCircle, FiMessageSquare } from 'react-icons/fi';
import UserDropdown from './UserDropdown';
import ProfileCard from './ProfileCard';
import BackButton from './BackButton';
import SessionNotifications from './SessionNotifications';

const domainHeadNav = [
    { to: '/domain-head/dashboard', icon: <FiGrid size={16} />, label: 'Dashboard' },
    { to: '/domain-head/notifications', icon: <FiBell size={16} />, label: 'Notifications' },
    { to: '/domain-head/issues', icon: <FiAlertTriangle size={16} />, label: 'System Issues' },
    { to: '/domain-head/queries', icon: <FiHelpCircle size={16} />, label: 'Student Queries' },
    { to: '/messages', icon: <FiMessageSquare size={16} />, label: 'Messages' },
];

const DomainHeadLayout = ({ children, title = 'Domain Dashboard' }) => {

    return (
        <div className="admin-layout">
            <SessionNotifications />
            <aside className="sidebar" id="dh-sidebar">
                <div className="sidebar-logo">
                    <div className="brand">
                        <CampusLensLogo iconSize={36} dark={true} />
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        {domainHeadNav.map(item => {
                            return (
                                <NavLink key={item.to} to={item.to}
                                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                                    <span className="nav-icon">{item.icon}</span>
                                    {item.label}
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>
                <div className="sidebar-footer" style={{ padding: '1.5rem 0', borderTop: '1px solid var(--clr-border)' }}>
                    <ProfileCard variant="sidebar" />
                    <div style={{ marginTop: '1rem', color: 'var(--clr-text-3)', fontSize: '0.75rem', textAlign: 'center' }}>
                        &copy; 2026 CampusLens
                    </div>
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

export default DomainHeadLayout;
