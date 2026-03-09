import React from 'react';
import { FiX } from 'react-icons/fi';
import MessagePortal from './MessagePortal';

const MessageModal = ({ isOpen, onClose, currentUserRole, availableRoles }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '650px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748b',
                        transition: 'all 0.2s',
                        zIndex: 10
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                >
                    <FiX size={18} />
                </button>

                {/* Wrapper overrides MessagePortal's border so it looks clean */}
                <div style={{ '& > div': { border: 'none !important', borderRadius: '16px' } }}>
                    <MessagePortal
                        currentUserRole={currentUserRole}
                        availableRoles={availableRoles}
                    />
                </div>
            </div>
        </div>
    );
};

export default MessageModal;
