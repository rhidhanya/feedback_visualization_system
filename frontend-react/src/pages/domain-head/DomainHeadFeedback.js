import React, { useState, useEffect, useCallback } from 'react';
import { FiInbox } from 'react-icons/fi';
import DomainHeadLayout from '../../components/DomainHeadLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const DomainHeadFeedback = () => {
    const { user } = useAuth();
    const domain = user?.assignedDomain;
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFb = useCallback(async () => {
        if (!domain) return;
        setLoading(true);
        try {
            const res = await api.get(`/domain-feedback?domain=${domain}`);
            setFeedback(res.data.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [domain]);

    useEffect(() => { fetchFb(); }, [fetchFb]);

    if (loading) return <DomainHeadLayout title="Feedback"><div className="loading-state"><div className="spinner" /></div></DomainHeadLayout>;

    return (
        <DomainHeadLayout title="Feedback">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Feedback Submissions ({feedback.length})</h2>
            <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
                {feedback.length === 0 ? (
                    <div className="empty-state" style={{ padding: '3rem' }}><FiInbox size={28} style={{ color: 'var(--clr-primary-lt)' }} /><span>No feedback yet</span></div>
                ) : (
                    <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                        {feedback.map(f => (
                            <div key={f._id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <strong style={{ fontSize: '0.88rem' }}>{f.studentId?.name || 'Student'}</strong>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ background: f.overallRating <= 2 ? 'var(--clr-danger-lt)' : 'var(--clr-accent-lt)', color: f.overallRating <= 2 ? 'var(--clr-danger)' : 'var(--clr-accent)', padding: '2px 8px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>{f.overallRating?.toFixed(1)}★</span>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {f.answers?.filter(a => a.comment).map((a, i) => (
                                    <p key={i} style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0' }}>💬 {a.comment}</p>
                                ))}
                                {f.generalComment && <p style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>"{f.generalComment}"</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DomainHeadLayout>
    );
};

export default DomainHeadFeedback;
