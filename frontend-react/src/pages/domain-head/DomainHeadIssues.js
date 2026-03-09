import React, { useState, useEffect, useCallback } from 'react';
import { FiInbox } from 'react-icons/fi';
import DomainHeadLayout from '../../components/DomainHeadLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = { Pending: 'var(--clr-primary)', 'In Progress': 'var(--clr-accent)', Rectified: 'var(--clr-success)', Closed: 'var(--clr-text-3)' };

const DomainHeadIssues = () => {
    const { user } = useAuth();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const fetchIssues = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/issues?domain=${user?.assignedDomain}`);
            setIssues(res.data.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchIssues(); }, [fetchIssues]);

    const updateStatus = async (id, status, headResponse) => {
        try {
            await api.put(`/issues/${id}/status`, { status, headResponse });
            setToast({ type: 'success', msg: `Status updated to "${status}"` });
            fetchIssues();
        } catch { setToast({ type: 'error', msg: 'Update failed' }); }
        setTimeout(() => setToast(null), 3000);
    };

    if (loading) return <DomainHeadLayout title="Issues"><div className="loading-state"><div className="spinner" /></div></DomainHeadLayout>;

    return (
        <DomainHeadLayout title="Issues">
            {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'success' ? 'var(--clr-accent)' : 'var(--clr-danger)', color: '#fff', padding: '12px 20px', borderRadius: 8 }}>{toast.msg}</div>}
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Issues ({issues.filter(i => i.status !== 'Closed').length} active)</h2>
            <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
                {issues.length === 0 ? (
                    <div className="empty-state" style={{ padding: '3rem' }}><FiInbox size={28} style={{ color: 'var(--clr-primary-lt)' }} /><span>No issues</span></div>
                ) : (
                    <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                        {issues.map(iss => (
                            <div key={iss._id} style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <strong style={{ fontSize: '0.88rem' }}>{iss.notificationId?.title || 'Issue'}</strong>
                                    <span style={{ background: `${STATUS_COLORS[iss.status]}18`, color: STATUS_COLORS[iss.status], padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>{iss.status}</span>
                                </div>
                                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 8 }}>{iss.notificationId?.message || ''}</p>
                                {iss.status !== 'Closed' && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {['In Progress', 'Rectified', 'Closed'].filter(s => s !== iss.status).map(s => (
                                            <button key={s} onClick={() => updateStatus(iss._id, s)}
                                                style={{ fontSize: '0.78rem', padding: '4px 12px', borderRadius: 6, border: `1px solid ${STATUS_COLORS[s]}40`, background: `${STATUS_COLORS[s]}08`, color: STATUS_COLORS[s], cursor: 'pointer', fontWeight: 600 }}>{s}</button>
                                        ))}
                                    </div>
                                )}
                                {iss.headResponse && <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: 6, fontStyle: 'italic' }}>Response: {iss.headResponse}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DomainHeadLayout>
    );
};

export default DomainHeadIssues;
