import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './ProfileCard.css';

const ProfileCard = ({ variant = 'sidebar' }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.name 
        ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() 
        : 'U';

    const getRoleDisplay = () => {
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
        <div className={`profile-card profile-card-${variant}`}>
            <div className="profile-card-content">
                <div className="profile-card-avatar">{initials}</div>
                <div className="profile-card-info">
                    <div className="profile-card-name">{user?.name}</div>
                    <div className="profile-card-role">{getRoleDisplay()}</div>
                </div>
            </div>
            <button className="profile-card-logout" onClick={handleLogout} title="Logout">
                <FiLogOut size={16} />
                <span>Logout</span>
            </button>
        </div>
    );
};

export default ProfileCard;
