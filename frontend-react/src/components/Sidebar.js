import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiGrid, FiMessageSquare, FiShield, FiMenu, FiChevronLeft } from 'react-icons/fi';
import './Sidebar.css';
import logo from '../logo.png';

const Sidebar = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => setCollapsed(!collapsed);

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <FiGrid /> },
        { path: '/feedback', label: 'Feedback', icon: <FiMessageSquare /> },
        { path: '/admin', label: 'Admin', icon: <FiShield />, role: 'admin' },
    ];

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="brand" onClick={toggleSidebar}>
                    <div className="brand-icon">
                        <img src={logo} alt="PRISM Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    {!collapsed && <span className="brand-text">PRISM</span>}
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
