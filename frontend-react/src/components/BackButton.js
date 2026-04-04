import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const BackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Hide back button on main dashboard paths and login
    const hideOnPaths = [
        '/login', 
        '/admin/domain-overview', 
        '/student/home', 
        '/hod/dashboard', 
        '/domain-head/dashboard',
        '/principal/dashboard',
        '/transport-dashboard',
        '/mess-dashboard',
        '/hostel-dashboard',
        '/sanitation-dashboard'
    ];

    if (hideOnPaths.includes(location.pathname)) {
        return null;
    }

    return (
        <button 
            className="btn btn-ghost back-btn-global" 
            onClick={() => navigate(-1)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                color: 'var(--clr-text-2)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                transition: 'all var(--trans)',
                border: '1px solid var(--clr-border)',
                background: 'var(--clr-surface)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--clr-primary)';
                e.currentTarget.style.borderColor = 'var(--clr-primary)';
                e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--clr-text-2)';
                e.currentTarget.style.borderColor = 'var(--clr-border)';
                e.currentTarget.style.transform = 'translateX(0)';
            }}
        >
            <FiArrowLeft size={18} />
            <span>Back</span>
        </button>
    );
};

export default BackButton;
