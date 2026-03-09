import React, { useState, useEffect, useCallback } from 'react';
import { FiInbox } from 'react-icons/fi';
import DomainHeadLayout from '../../components/DomainHeadLayout';
import api from '../../api/axios';

const DomainHeadNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications/my');
            setNotifications(res.data.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const markRead = async (id) => { await api.put(`/notifications/${id}/read`); fetch(); };

    if (loading) return <DomainHeadLayout title="Notifications"><div className="loading-state"><div className="spinner" /></div></DomainHeadLayout>;

    return (
        <DomainHeadLayout title="Notifications">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Notifications ({notifications.filter(n => !n.isRead).length} unread)</h2>
            <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
                {notifications.length === 0 ? (
                    <div className="empty-state" style={{ padding: '3rem' }}><FiInbox size={28} /><span>No notifications</span></div>
                ) : (
                    <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                        {notifications.map(n => (
                            <div key={n._id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', background: n.isRead ? '#fff' : '#f0f9ff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong style={{ fontSize: '0.88rem' }}>{n.title}</strong>
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(n.createdAt).toLocaleString()}</span>
                                </div>
                                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0' }}>{n.message}</p>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>From: {n.fromUserId?.name || 'Admin'}</span>
                                    {!n.isRead && <button onClick={() => markRead(n._id)} style={{ background: 'none', border: 'none', color: 'var(--clr-accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}>Mark Read</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DomainHeadLayout>
    );
};

export default DomainHeadNotifications;
