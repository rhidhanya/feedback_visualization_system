import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CampusLensLogo } from './CollegePulseLogo';
import { useAuth } from '../context/AuthContext';
import { FiBarChart2, FiUserPlus, FiUserCheck, FiUsers, FiBook, FiBell, FiCheckCircle, FiAlertCircle, FiAward, FiShield, FiBriefcase, FiLayers, FiBookOpen } from 'react-icons/fi';
import UserDropdown from './UserDropdown';
import ProfileCard from './ProfileCard';
import BackButton from './BackButton';
import SessionNotifications from './SessionNotifications';

const adminNavMain = [
    { to: '/admin/domain-overview', icon: <FiBarChart2 size={16} />, label: 'Domain Overview' },
];

const adminNavManage = [
    { to: '/admin/faculty-management', icon: <FiAward size={16} />, label: 'Manage Faculties' },
    { to: '/admin/hod-management', icon: <FiShield size={16} />, label: 'Manage HOD' },
    { to: '/admin/domain-heads', icon: <FiBriefcase size={16} />, label: 'Manage Incharges' },
    { to: '/admin/users-management', icon: <FiLayers size={16} />, label: 'Users' },
    { to: '/admin/users', icon: <FiBookOpen size={16} />, label: 'Students' },
    { to: '/admin/subjects-management', icon: <FiBook size={16} />, label: 'Manage Subjects' },
    { to: '/admin/notifications', icon: <FiBell size={16} />, label: 'Notifications' },
];

const AdminLayout = ({ children, title = 'Dashboard', noSidebar = false, headerLeft, headerRight }) => {
    const { user } = useAuth();

    // Show Management section only for admin
    const showManagement = user?.role === 'admin';
    
    const location = useLocation();
    
    // HOD should go to their dashboard for overview
    const mainNav = user?.role === 'hod' 
        ? [
            { to: '/hod/dashboard', icon: <FiBarChart2 size={16} />, label: 'Overview' },
            { to: '/hod/dashboard?tab=high_performing', icon: <FiCheckCircle size={16} />, label: 'High Performing' },
            { to: '/hod/dashboard?tab=areas_improvement', icon: <FiAlertCircle size={16} />, label: 'Areas of Improvement' }
        ]
        : adminNavMain;

    return (
        <div className="admin-layout">
            <SessionNotifications />
            {/* ── Sidebar ── */}
            {!noSidebar && (
            <aside className="sidebar" id="admin-sidebar">
                <div className="sidebar-logo">
                    <div className="brand">
                        <CampusLensLogo iconSize={36} dark={true} />
                    </div>
                </div>

                <nav className="sidebar-nav" style={{ padding: '0 1rem' }}>
                    <div className="nav-section" style={{ marginTop: '1.25rem' }}>
                        {mainNav.map(item => {
                            const isActive = location.pathname + location.search === item.to || 
                                           (item.to === '/hod/dashboard' && location.pathname === '/hod/dashboard' && !location.search);
                            return (
                                <NavLink 
                                    key={item.to} 
                                    to={item.to} 
                                    className={`nav-item${isActive ? ' active' : ''}`} 
                                    style={{ marginBottom: '0.5rem' }}
                                >
                                    <span className="nav-icon">{item.icon}</span>{item.label}
                                </NavLink>
                            );
                        })}
                    </div>
                    {showManagement && (
                        <div className="nav-section">
                            {adminNavManage.map(item => (
                                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ marginBottom: '0.5rem' }}>
                                    <span className="nav-icon">{item.icon}</span>{item.label}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer" style={{ padding: '1.5rem 0', borderTop: '1px solid var(--clr-border)' }}>
                    <ProfileCard variant="sidebar" />
                    <div style={{ marginTop: '1rem', color: 'var(--clr-text-3)', fontSize: '0.75rem', textAlign: 'center' }}>
                        &copy; 2026 CampusLens
                    </div>
                </div>
            </aside>
            )}

            {/* ── Main ── */}
            <div className="main-content" style={noSidebar ? { marginLeft: 0 } : {}}>
                <header className="topbar">
                    <div className="topbar-left">
                        {headerLeft}
                    </div>
                    <div className="topbar-right">
                        {headerRight}
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

export default AdminLayout;
