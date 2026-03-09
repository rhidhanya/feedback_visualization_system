import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSend, FiPlus, FiMessageCircle, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const StudentQueries = () => {
    // `user` removed due to unused variable warning from linter
    useAuth();
    const navigate = useNavigate();
    const [queries, setQueries] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ domain: 'transport', subject: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchQueries = async () => {
        try {
            setLoading(true);
            const res = await api.get('/queries');
            if (res.data.success) {
                setQueries(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch queries", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueries();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/queries', formData);
            setShowForm(false);
            setFormData({ domain: 'transport', subject: '', description: '' });
            fetchQueries(); // refresh
        } catch (err) {
            console.error("Failed to submit query", err);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': return <FiCheckCircle color="var(--clr-accent)" />;
            case 'In Progress': return <FiClock color="var(--clr-primary)" />;
            default: return <FiAlertCircle color="var(--clr-danger)" />;
        }
    };

    const domains = [
        { id: 'transport', label: 'Transport' },
        { id: 'mess', label: 'Mess' },
        { id: 'hostel', label: 'Hostel' },
        { id: 'sanitation', label: 'Sanitation' },
        { id: 'academic', label: 'Academic' }
    ];

    return (
        <div className="student-layout">
            <header className="student-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 34, height: 34, background: 'var(--clr-primary-lt)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiMessageCircle size={18} color="var(--clr-primary)" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>CampusLens</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>Queries & Support</div>
                    </div>
                </div>
                <button
                    className="btn btn-ghost"
                    onClick={() => navigate('/student/home')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem' }}
                >
                    <FiArrowLeft size={14} /> Back to Home
                </button>
            </header>

            <div className="student-content">
                <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', color: '#0f172a', margin: '0 0 0.25rem 0' }}>Support & Queries</h2>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Raise issues related to campus facilities or academics.</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clr-primary)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {showForm ? 'Cancel' : <><FiPlus size={16} /> Raise New Query</>}
                        </button>
                    </div>

                    {showForm && (
                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem', color: '#0f172a' }}>New Query Details</h3>
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Related Domain</label>
                                        <select
                                            value={formData.domain}
                                            onChange={e => setFormData({ ...formData, domain: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        >
                                            {domains.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Subject / Issue Title</label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="Brief description of the issue"
                                            required
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Detailed Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Provide more context..."
                                        rows={4}
                                        required
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clr-primary)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    <FiSend size={16} /> {submitting ? 'Submitting...' : 'Submit Query'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Loading queries...</div>
                        ) : queries.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                <FiMessageCircle size={32} style={{ marginBottom: '1rem', color: '#cbd5e1' }} />
                                <p>You haven't raised any queries yet.</p>
                            </div>
                        ) : (
                            queries.map(q => (
                                <div key={q._id} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                    {q.domain}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                    {new Date(q.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{q.subject}</h3>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '20px', background: q.status === 'Resolved' ? 'var(--clr-accent-lt)' : q.status === 'In Progress' ? 'var(--clr-primary-lt)' : 'var(--clr-danger-lt)', color: q.status === 'Resolved' ? 'var(--clr-accent)' : q.status === 'In Progress' ? 'var(--clr-primary)' : 'var(--clr-danger)' }}>
                                            {getStatusIcon(q.status)} {q.status}
                                        </div>
                                    </div>
                                    <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0 0 1.5rem 0', whiteSpace: 'pre-wrap' }}>{q.description}</p>

                                    {q.responses && q.responses.length > 0 && (
                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--clr-primary)' }}>
                                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <FiMessageCircle size={14} /> Official Responses
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {q.responses.map((resp, idx) => (
                                                    <div key={idx} style={{ fontSize: '0.9rem', color: '#334155' }}>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.1rem', fontWeight: 600 }}>
                                                            {resp.responderRole?.toUpperCase()} • {new Date(resp.createdAt).toLocaleString()}
                                                        </div>
                                                        <div>{resp.message}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentQueries;
