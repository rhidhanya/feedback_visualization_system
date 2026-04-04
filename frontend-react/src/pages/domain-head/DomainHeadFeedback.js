import React, { useState, useEffect, useCallback } from 'react';
import { FiInbox, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DomainHeadLayout from '../../components/DomainHeadLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const DomainHeadFeedback = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const domain = user?.assignedDomain;
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

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

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentFeedback = feedback.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(feedback.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <DomainHeadLayout title="Feedback">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Feedback Submissions ({feedback.length})</h2>
            </div>
            <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
                {feedback.length === 0 ? (
                    <div className="empty-state" style={{ padding: '3rem' }}><FiInbox size={28} style={{ color: 'var(--clr-primary-lt)' }} /><span>No feedback yet</span></div>
                ) : (
                    <div style={{ maxHeight: 'none' }}>
                        {currentFeedback.map(f => (
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

            {totalPages > 1 && (
                <div className="pagination" style={{ marginTop: '1.5rem' }}>
                    <button 
                        className="pagination-btn pagination-nav-btn"
                        disabled={currentPage === 1}
                        onClick={() => paginate(currentPage - 1)}
                    >
                        ← Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button 
                            key={i}
                            className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                            onClick={() => paginate(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button 
                        className="pagination-btn pagination-nav-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => paginate(currentPage + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}
        </DomainHeadLayout>
    );
};

export default DomainHeadFeedback;
