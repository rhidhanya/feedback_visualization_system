import React, { useState, useEffect, useCallback } from 'react';
import { FiInbox, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DomainHeadLayout from '../../components/DomainHeadLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = { Pending: 'var(--clr-primary)', 'In Progress': 'var(--clr-accent)', Rectified: 'var(--clr-success)', Closed: 'var(--clr-text-3)' };

const DomainHeadIssues = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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

    // Pagination Logic
    const activeIssues = issues.filter(i => i.status !== 'Closed');
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentIssues = activeIssues.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(activeIssues.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <DomainHeadLayout title="Issues">
            {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'success' ? 'var(--clr-accent)' : 'var(--clr-danger)', color: '#fff', padding: '12px 20px', borderRadius: 8 }}>{toast.msg}</div>}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Issues ({activeIssues.length} active)</h2>
            </div>
            <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
                {issues.length === 0 ? (
                    <div className="empty-state" style={{ padding: '3rem' }}><FiInbox size={28} style={{ color: 'var(--clr-primary-lt)' }} /><span>No issues</span></div>
                ) : (
                    <div style={{ maxHeight: 'none' }}>
                        {currentIssues.map(iss => (
                            <div key={iss._id} style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <strong style={{ fontSize: '0.88rem' }}>{iss.notificationId?.title || 'Issue'}</strong>
                                    <span style={{ background: `${STATUS_COLORS[iss.status]}18`, color: STATUS_COLORS[iss.status], padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>{iss.status}</span>
                                </div>
                                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 8 }}>{iss.notificationId?.message || ''}</p>
                                {iss.status !== 'Closed' && (
                                    <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                        {[
                                            { id: 'In Progress', icon: <FiClock size={13} /> },
                                            { id: 'Rectified', icon: <FiCheckCircle size={13} /> },
                                            { id: 'Closed', icon: <FiXCircle size={13} /> }
                                        ].filter(s => s.id !== iss.status).map(s => (
                                            <button 
                                                key={s.id} 
                                                onClick={() => updateStatus(iss._id, s.id)}
                                                className="status-update-btn"
                                                style={{ 
                                                    '--btn-clr': STATUS_COLORS[s.id],
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '0.4rem',
                                                    fontSize: '0.78rem', 
                                                    padding: '6px 14px', 
                                                    borderRadius: '8px', 
                                                    border: `1px solid ${STATUS_COLORS[s.id]}40`, 
                                                    background: `${STATUS_COLORS[s.id]}08`, 
                                                    color: STATUS_COLORS[s.id], 
                                                    cursor: 'pointer', 
                                                    fontWeight: 600,
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.background = `${STATUS_COLORS[s.id]}15`;
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.background = `${STATUS_COLORS[s.id]}08`;
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                {s.icon} {s.id}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {iss.headResponse && <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: 6, fontStyle: 'italic' }}>Response: {iss.headResponse}</p>}
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

export default DomainHeadIssues;
