import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './UserDropdown.css';

const UserDropdown = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

    const getSubInfo = () => {
        if (user?.role === 'student') {
            return `Sem ${user.semester || '-'} • ${user.rollNumber || '-'}`;
        }
        if (user?.role === 'faculty') {
            return `Faculty • ${user.department?.code || user.department?.name || '-'}`;
        }
        if (user?.role === 'hod') {
            return `HOD • ${user.department?.code || user.department?.name || '-'}`;
        }
        if (user?.role === 'domain_head') {
            return `${user.assignedDomain?.charAt(0).toUpperCase() + user.assignedDomain?.slice(1)} Head`;
        }
        return user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1);
    };

    return (
        <div className="user-dropdown-container" ref={dropdownRef}>
            <div className="user-trigger" onClick={() => setIsOpen(!isOpen)}>
                <div className="user-avatar">{initials}</div>
                <div className="user-name-wrapper">
                    <span className="user-display-name">{user?.name}</span>
                    <span className="user-role-badge">{user?.role === 'student' ? 'Student' : user?.role?.toUpperCase()}</span>
                </div>
            </div>

            {isOpen && (
                <div className="user-menu-card">
                    <div className="user-menu-header">
                        <div className="header-avatar">{initials}</div>
                        <div className="header-info">
                            <div className="header-name">{user?.name}</div>
                            <div className="header-sub">{getSubInfo()}</div>
                        </div>
                    </div>
                    <div className="user-menu-divider"></div>
                    <div className="user-menu-items">
                        {user?.role !== 'student' && (
                            <button className="menu-item" onClick={() => { navigate('/messages'); setIsOpen(false); }}>
                                <FiMessageSquare size={16} />
                                <span>Messages</span>
                            </button>
                        )}
                        <button className="menu-item logout-item" onClick={handleLogout}>
                            <FiLogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;
