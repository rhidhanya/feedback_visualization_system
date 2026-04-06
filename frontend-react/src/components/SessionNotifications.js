import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_CONFIG } from '../config';
import { FiX, FiInfo, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const BACKEND_URL = API_CONFIG.SOCKET_URL;

const SessionNotifications = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const socket = io(BACKEND_URL);

        socket.on('session_notification', (notif) => {
            const id = Date.now();
            const newNotif = { ...notif, id };
            
            setNotifications(prev => [newNotif, ...prev].slice(0, 5)); // Keep last 5

            // Auto-remove after 5 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 5000);
        });

        return () => socket.disconnect();
    }, []);

    if (notifications.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '350px'
        }}>
            {notifications.map(n => (
                <div key={n.id} style={{
                    background: 'white',
                    borderLeft: `4px solid ${n.type === 'login' ? '#3b82f6' : n.type === 'feedback' ? '#10b981' : '#f59e0b'}`,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'slideIn 0.3s ease-out',
                    position: 'relative'
                }}>
                    <div style={{ color: n.type === 'login' ? '#3b82f6' : n.type === 'feedback' ? '#10b981' : '#f59e0b', display: 'flex' }}>
                        {n.type === 'login' && <FiInfo size={20} />}
                        {n.type === 'feedback' && <FiCheckCircle size={20} />}
                        {n.type === 'issue' && <FiAlertCircle size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1f2937' }}>{n.message}</div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>Just now</div>
                    </div>
                    <button 
                        onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
                    >
                        <FiX size={14} />
                    </button>
                    
                    <style>{`
                        @keyframes slideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `}</style>
                </div>
            ))}
        </div>
    );
};

export default SessionNotifications;
