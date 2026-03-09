import React, { useState, useEffect, useCallback } from 'react';
import { FiBell, FiSend, FiInbox, FiAlertTriangle } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [domainHeads, setDomainHeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendModal, setSendModal] = useState(false);
    const [form, setForm] = useState({ toUserId: '', domain: '', title: '', message: '', type: 'admin_alert' });
    const [formLoading, setFormLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [filter, setFilter] = useState('');

    const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [nRes, hRes] = await Promise.all([
                api.get('/notifications' + (filter ? `?domain=${filter}` : '')),
                api.get('/users?role=domain_head'),
            ]);
            setNotifications(nRes.data.data || []);
            setDomainHeads(hRes.data.data || []);
        } catch { showToast('error', 'Failed to load'); } finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!form.toUserId || !form.domain || !form.title || !form.message) return;
        setFormLoading(true);
        try {
            await api.post('/notifications', form);
            showToast('success', 'Notification sent');
            setSendModal(false);
            setForm({ toUserId: '', domain: '', title: '', message: '', type: 'admin_alert' });
            fetchAll();
        } catch (err) { showToast('error', err.response?.data?.message || 'Failed'); } finally { setFormLoading(false); }
    };

    const selectHead = (headId) => {
        const head = domainHeads.find(h => h._id === headId);
        setForm(p => ({ ...p, toUserId: headId, domain: head?.assignedDomain || '' }));
    };

    return (
        <AdminLayout title="Notification Center">
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'success' ? 'var(--clr-accent)' : 'var(--clr-danger)', color: '#fff', padding: '12px 20px', borderRadius: 8 }}>{toast.msg}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.15rem' }}>Notifications</h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Send alerts to domain heads about feedback issues</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                        <option value="">All Domains</option>
                        {['transport', 'mess', 'hostel', 'sanitation'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={() => setSendModal(true)} style={{ background: 'var(--clr-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiSend size={14} /> Send Notification
                    </button>
                </div>
            </div>

            <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div className="loading-state"><div className="spinner" /></div> :
                    notifications.length === 0 ? (
                        <div className="empty-state" style={{ padding: '3rem' }}><FiInbox size={28} style={{ color: 'var(--clr-primary-lt)' }} /><span>No notifications yet</span></div>
                    ) : (
                        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                            {notifications.map(n => (
                                <div key={n._id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{ background: n.type === 'negative_feedback' ? '#fee2e2' : '#f0f9ff', padding: 8, borderRadius: 8, flexShrink: 0 }}>
                                        {n.type === 'negative_feedback' ? <FiAlertTriangle size={16} style={{ color: 'var(--clr-danger)' }} /> : <FiBell size={16} style={{ color: 'var(--clr-primary)' }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <strong style={{ fontSize: '0.88rem' }}>{n.title}</strong>
                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(n.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0' }}>{n.message}</p>
                                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                            <span>To: <strong>{n.toUserId?.name || '—'}</strong></span>
                                            <span>Domain: <strong>{n.domain}</strong></span>
                                            <span style={{ color: n.isRead ? 'var(--clr-accent)' : 'var(--clr-danger)' }}>{n.isRead ? 'Read' : 'Unread'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>

            {/* Send Modal */}
            {sendModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 500, width: '90%' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Send Notification</h3>
                        <form onSubmit={handleSend}>
                            <div className="input-group"><label>Recipient (Domain Head)</label>
                                <select value={form.toUserId} onChange={e => selectHead(e.target.value)} required>
                                    <option value="">Select head…</option>
                                    {domainHeads.map(h => <option key={h._id} value={h._id}>{h.name} — {h.assignedDomain}</option>)}
                                </select>
                            </div>
                            <div className="input-group"><label>Type</label>
                                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                                    <option value="admin_alert">Admin Alert</option>
                                    <option value="negative_feedback">Negative Feedback Alert</option>
                                    <option value="general">General</option>
                                </select>
                            </div>
                            <div className="input-group"><label>Title</label>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Low rating detected" />
                            </div>
                            <div className="input-group"><label>Message</label>
                                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required rows={4} placeholder="Describe the issue…"
                                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem', fontSize: '0.85rem' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setSendModal(false)} className="btn" style={{ background: '#f1f5f9' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ background: 'var(--clr-primary)' }}>
                                    {formLoading ? 'Sending…' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default NotificationCenter;
