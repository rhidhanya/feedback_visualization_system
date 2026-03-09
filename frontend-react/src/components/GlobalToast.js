import React, { useEffect } from 'react';
import { FiMessageSquare, FiX } from 'react-icons/fi';

const GlobalToast = ({ notification, onClose }) => {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000); // Hide after 4 seconds
            return () => clearTimeout(timer);
        }
    }, [notification, onClose]);

    if (!notification) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '1rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            borderLeft: '4px solid var(--clr-primary)',
            minWidth: '280px',
            animation: 'slideIn 0.3s ease-out'
        }}>
            <div style={{ background: 'var(--clr-primary-lt)', padding: '0.5rem', borderRadius: '50%', color: 'var(--clr-primary)', marginTop: '2px' }}>
                 <FiMessageSquare size={20} />
            </div>
            <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontSize: '0.95rem' }}>{notification.title}</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{notification.message}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}>
                <FiX size={16} />
            </button>
            <style>
                {`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                `}
            </style>
        </div>
    );
};

export default GlobalToast;
