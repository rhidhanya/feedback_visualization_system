import React, { useState, useEffect, useCallback } from 'react';
import { FiInbox, FiMessageCircle, FiCheckCircle, FiClock, FiAlertCircle, FiSend } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DomainHeadLayout from '../../components/DomainHeadLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = { 
    'Open': 'var(--clr-danger)', 
    'In Progress': 'var(--clr-primary)', 
    'Resolved': 'var(--clr-accent)', 
    'Rectified': 'var(--clr-success)' 
};

const DomainHeadQueries = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [respondingTo, setRespondingTo] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchQueries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/queries');
            setQueries(res.data.data || []);
        } catch (err) { 
            console.error(err); 
            setToast({ type: 'error', msg: 'Failed to load queries' });
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => { 
        fetchQueries(); 
    }, [fetchQueries]);

    const handleUpdate = async (id, status, message) => {
        setSubmitting(true);
        try {
            await api.put(`/queries/${id}`, { status, message });
            setToast({ type: 'success', msg: 'Query updated successfully' });
            setRespondingTo(null);
            setResponseMessage('');
            fetchQueries();
        } catch (err) { 
            setToast({ type: 'error', msg: 'Update failed' }); 
        } finally {
            setSubmitting(false);
        }
        setTimeout(() => setToast(null), 3000);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': case 'Rectified': return <FiCheckCircle />;
            case 'In Progress': return <FiClock />;
            default: return <FiAlertCircle />;
        }
    };

    if (loading) return <DomainHeadLayout title="Student Queries"><div className="loading-state"><div className="spinner" /></div></DomainHeadLayout>;

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentQueries = queries.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(queries.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <DomainHeadLayout title="Student Queries">
            {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'success' ? 'var(--clr-accent)' : 'var(--clr-danger)', color: '#fff', padding: '12px 20px', borderRadius: 8, boxShadow: 'var(--shadow-md)' }}>{toast.msg}</div>}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingTop: '1.25rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Student Queries ({queries.length})</h2>
                    <p style={{ color: 'var(--clr-text-3)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Managed queries for {user?.assignedDomain} domain.</p>
                </div>
            </div>

            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                {queries.length === 0 ? (
                    <div className="empty-state" style={{ padding: '4rem' }}>
                        <FiInbox size={32} style={{ color: 'var(--clr-primary-lt)', marginBottom: '1rem' }} />
                        <span style={{ color: 'var(--clr-text-3)' }}>No queries found for your domain.</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {currentQueries.map(q => {
                            const statusColor = STATUS_COLORS[q.status] || 'var(--clr-primary)';
                            return (
                                <div key={q._id} style={{ padding: '1.5rem', borderBottom: '1px solid var(--clr-border)', transition: 'background 0.2s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <span style={{ 
                                                    background: statusColor + '15', 
                                                    color: statusColor, 
                                                    padding: '4px 12px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem'
                                                }}>
                                                    {getStatusIcon(q.status)} {q.status}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>
                                                    {new Date(q.createdAt).toLocaleDateString()} at {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--clr-text)' }}>{q.subject}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--clr-primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--clr-primary)' }}>
                                                    {q.student?.name?.[0]}
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{q.student?.name}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>• {q.student?.rollNumber || 'No ID'}</span>
                                            </div>
                                        </div>
                                        {q.status !== 'Resolved' && q.status !== 'Rectified' && (
                                            <button 
                                                className="btn btn-primary" 
                                                onClick={() => setRespondingTo(respondingTo === q._id ? null : q._id)}
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                            >
                                                <FiMessageCircle size={14} /> {respondingTo === q._id ? 'Cancel' : 'Respond'}
                                            </button>
                                        )}
                                    </div>
                                    
                                    <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-2)', lineHeight: 1.6, margin: 0, padding: '0.75rem', background: 'var(--clr-surface-2)', borderRadius: '8px' }}>
                                        {q.description}
                                    </p>

                                    {respondingTo === q._id && (
                                        <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'var(--clr-primary-lt)', borderRadius: '12px', border: '1px solid var(--clr-primary)20' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--clr-primary)' }}>Official Response</label>
                                            <textarea 
                                                value={responseMessage}
                                                onChange={e => setResponseMessage(e.target.value)}
                                                placeholder="Type your response here..."
                                                rows={3}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--clr-border)', marginBottom: '1rem', resize: 'vertical', fontSize: '0.9rem' }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button 
                                                    className="btn btn-primary"
                                                    disabled={submitting || !responseMessage.trim()}
                                                    onClick={() => handleUpdate(q._id, 'In Progress', responseMessage)}
                                                    style={{ flex: 1 }}
                                                >
                                                    <FiSend size={14} /> Send & Keep In Progress
                                                </button>
                                                <button 
                                                    className="btn btn-accent"
                                                    disabled={submitting || !responseMessage.trim()}
                                                    onClick={() => handleUpdate(q._id, 'Resolved', responseMessage)}
                                                    style={{ flex: 1 }}
                                                >
                                                    <FiCheckCircle size={14} /> Send & Resolve
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {q.responses && q.responses.length > 0 && (
                                        <div style={{ marginTop: '1.25rem' }}>
                                            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--clr-text-3)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Previous Responses</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {q.responses.map((resp, idx) => (
                                                    <div key={idx} style={{ padding: '1rem', background: 'var(--clr-surface-1)', borderRadius: '8px', borderLeft: '3px solid ' + (resp.responderRole === 'student' ? 'var(--clr-border)' : 'var(--clr-primary)') }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{resp.responder?.name} <small style={{ fontWeight: 400, color: 'var(--clr-text-3)' }}>({resp.responderRole})</small></span>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-3)' }}>{new Date(resp.createdAt).toLocaleString()}</span>
                                                        </div>
                                                        <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--clr-text-2)' }}>{resp.message}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
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

export default DomainHeadQueries;
