import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiMessageSquare, FiBell, FiAlertCircle, FiLogOut } from 'react-icons/fi';
import { CampusLensLogo } from './CollegePulseLogo';
import { useAuth } from '../context/AuthContext';

const domainHeadNav = [
    { to: '/domain-head/dashboard', icon: <FiGrid size={16} />, label: 'Dashboard' },
    { to: '/domain-head/feedback', icon: <FiMessageSquare size={16} />, label: 'Feedback' },
    { to: '/domain-head/notifications', icon: <FiBell size={16} />, label: 'Notifications' },
    { to: '/domain-head/issues', icon: <FiAlertCircle size={16} />, label: 'Issues' },
];

const DomainHeadLayout = ({ children, title = 'Domain Dashboard' }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/domain-head-login'); };
    const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DH';
    const domainLabel = user?.assignedDomain ? user.assignedDomain.charAt(0).toUpperCase() + user.assignedDomain.slice(1) : 'Domain';

    return (
        <div className="admin-layout">
            <aside className="sidebar" id="dh-sidebar">
                <div className="sidebar-logo">
                    <CampusLensLogo iconSize={34} />
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-label">{domainLabel} Head</div>
                        {domainHeadNav.map(item => {
                            if (item.label === 'Feedback' && !['academics', 'faculty'].includes(domainLabel.toLowerCase())) {
                                return null;
                            }
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
                <div className="sidebar-footer">
                    <button className="nav-item" style={{ color: 'var(--clr-danger)' }} onClick={handleLogout}>
                        <span className="nav-icon"><FiLogOut size={16} /></span> Logout
                    </button>
                </div>
            </aside>
            <div className="main-content">
                <header className="topbar">
                    <span className="topbar-title">{title}</span>
                    <div className="topbar-right">
                        <div className="user-chip">
                            <div className="user-avatar" style={{ background: '#088F8F' }}>{initials}</div>
                            <span>{user?.name}</span>
                            <span className="badge" style={{ background: '#088F8F', color: '#fff', marginLeft: '0.25rem' }}>{domainLabel} Head</span>
                        </div>
                    </div>
                </header>
                <main className="page-content">{children}</main>
            </div>
        </div>
    );
};

export default DomainHeadLayout;
