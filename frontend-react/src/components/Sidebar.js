import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiGrid, FiMessageSquare, FiShield, FiMenu, FiChevronLeft } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => setCollapsed(!collapsed);

    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: <FiGrid /> },
        { path: '/admin/manage', label: 'Management', icon: <FiShield />, role: 'ADMIN' },
    ];

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="brand" onClick={() => navigate('/admin/dashboard')}>
                    <div className="brand-icon">
                        {/* Placeholder for EdTech branding */}
                        <div style={{ width: 30, height: 30, background: 'var(--clr-primary)', borderRadius: 4 }}></div>
                    </div>
                    {!collapsed && <span className="brand-text">CampusLens</span>}
                </div>
                <button className="collapse-btn" onClick={toggleSidebar}>
                    {collapsed ? <FiMenu /> : <FiChevronLeft />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    if (item.role && user?.role !== item.role) return null;

                    return (
                        <div
                            key={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                            title={collapsed ? item.label : ''}
                        >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
