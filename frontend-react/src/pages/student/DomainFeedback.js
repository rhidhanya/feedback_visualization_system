import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiCheck, FiArrowLeft, FiTruck, FiCoffee, FiHome, FiDroplet, FiGrid } from 'react-icons/fi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// Domain icon map
const DOMAIN_ICONS = {
    transport: <FiTruck size={24} />,
    mess: <FiCoffee size={24} />,
    hostel: <FiHome size={24} />,
    sanitation: <FiDroplet size={24} />,
};
const DOMAIN_COLORS = {
    transport: 'var(--clr-p-main)',
    mess: 'var(--clr-accent)',
    hostel: 'var(--clr-p-dark)',
    sanitation: 'var(--clr-primary)',
};

const StarRating = ({ value, onChange, fieldKey }) => (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[1, 2, 3, 4, 5].map(star => (
            <span
                key={star}
                id={`star-${fieldKey}-${star}`}
                onClick={() => onChange(star)}
                style={{
                    fontSize: '2rem', cursor: 'pointer',
                    color: value >= star ? 'var(--clr-primary)' : '#e2e8f0',
                    transition: 'color 0.15s, transform 0.1s',
                    display: 'inline-block',
                    transform: value >= star ? 'scale(1.1)' : 'scale(1)',
                }}
            >★</span>
        ))}
    </div>
);

const DomainFeedback = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [domains, setDomains] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [answers, setAnswers] = useState({});
    const [generalComment, setGeneralComment] = useState('');
    const [submitted, setSubmitted] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [domRes, myRes] = await Promise.all([
                api.get('/domains?active=true'),
                api.get('/domain-feedback/my'),
            ]);
            let fetchedDomains = domRes.data.data || [];

            // Filter based on residence type
            if (user?.residenceType === 'hosteller') {
                // Hostellers see: Hostel, Mess, Sanitation
                fetchedDomains = fetchedDomains.filter(d => d.slug !== 'transport');
            } else if (user?.residenceType === 'dayscholar') {
                // Day Scholars see: Transport, Mess, Sanitation
                fetchedDomains = fetchedDomains.filter(d => d.slug !== 'hostel');
            } else {
                // Fallback for unknown type: show all basic ones (Transport, Mess, Sanitation)
                fetchedDomains = fetchedDomains.filter(d => d.slug !== 'hostel');
            }

            setDomains(fetchedDomains);
            setSubmitted((myRes.data.data || []).map(f => f.domainSlug));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.residenceType]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRating = (qId, val) =>
        setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], rating: val } }));

    const handleComment = (qId, val) =>
        setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], comment: val } }));

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDomain) return;

        // Validate required ratings
        const unanswered = selectedDomain.questions.filter(
            q => q.type === 'rating' && q.required && !answers[q._id]?.rating
        );
        if (unanswered.length > 0) {
            showToast('error', `Please rate all required questions (${unanswered.length} missing)`);
            return;
        }

        setSubmitting(true);
        try {
            const answersArr = selectedDomain.questions.map(q => ({
                questionId: q._id,
                questionText: q.text,
                rating: answers[q._id]?.rating || undefined,
                comment: answers[q._id]?.comment || '',
            }));

            await api.post('/domain-feedback', {
                domainSlug: selectedDomain.slug,
                answers: answersArr,
                generalComment,
                semester: user.semester || 1,
                academicYear: '2025-26',
            });

            showToast('success', `✓ ${selectedDomain.name} feedback submitted!`);
            setSelectedDomain(null);
            setAnswers({});
            setGeneralComment('');
            fetchData();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const doneCount = submitted.length;

    return (
        <div className="student-layout">
            {/* Topbar */}
            <header className="student-topbar" id="campus-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 34, height: 34, background: 'var(--clr-primary-lt)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiGrid size={18} color="var(--clr-primary)" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>CampusLens</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>Campus Services Portal</div>
                    </div>
                </div>
                <button
                    id="back-to-home-btn"
                    className="btn btn-ghost"
                    onClick={() => navigate('/student/home')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem' }}
                >
                    <FiArrowLeft size={14} /> Back to Home
                </button>
            </header>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    background: toast.type === 'success' ? 'var(--clr-success)' : 'var(--clr-danger)',
                    color: '#fff', padding: '12px 20px', borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: '0.9rem', fontWeight: 500,
                    animation: 'slideIn 0.3s ease',
                }}>
                    {toast.type === 'success' ? <FiCheckCircle size={16} /> : null}
                    {toast.msg}
                </div>
            )}

            <div className="student-content">
                {loading ? (
                    <div className="loading-state" style={{ minHeight: '60vh' }}>
                        <div className="spinner" /><span>Loading campus services…</span>
                    </div>
                ) : !selectedDomain ? (
                    <>
                        {/* Page Header */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '0.3rem' }}>
                                Campus Services Feedback
                            </h2>
                            <p style={{ color: 'var(--clr-text-3)', fontSize: '0.9rem' }}>
                                Help us improve campus life · {doneCount} of {domains.length} completed
                            </p>
                            <div style={{ marginTop: '0.75rem', height: 6, borderRadius: 3, background: 'var(--clr-surface-2)', overflow: 'hidden', maxWidth: 300 }}>
                                <div style={{ height: '100%', width: `${domains.length ? (doneCount / domains.length) * 100 : 0}%`, background: 'var(--clr-primary)', borderRadius: 3, transition: 'width 0.4s ease' }} />
                            </div>
                        </div>

                        {/* Domain Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                            {domains.map(d => {
                                const isDone = submitted.includes(d.slug);
                                const color = DOMAIN_COLORS[d.slug] || 'var(--clr-primary)';
                                const icon = DOMAIN_ICONS[d.slug] || <FiGrid size={24} />;
                                return (
                                    <div
                                        key={d._id}
                                        id={`domain-card-${d.slug}`}
                                        style={{
                                            background: '#fff',
                                            border: `2px solid ${isDone ? '#bbf7d0' : '#e2e8f0'}`,
                                            borderRadius: 14,
                                            padding: '1.5rem',
                                            display: 'flex', flexDirection: 'column', gap: '1rem',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isDone ? '0 2px 12px rgba(16,185,129,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                                            opacity: isDone ? 0.85 : 1,
                                        }}
                                    >
                                        {/* Card Header */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                            <div style={{
                                                width: 52, height: 52, borderRadius: 12,
                                                background: `${color}14`,
                                                color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                {icon}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--clr-text-1)' }}>{d.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', marginTop: '0.2rem' }}>{d.description || 'Campus Service'}</div>
                                            </div>
                                        </div>

                                        {/* Question count */}
                                        <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>
                                            {d.questions?.length || 0} rating criteria
                                        </div>

                                        {/* Status & Action */}
                                        {isDone ? (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                                borderRadius: 8, padding: '0.625rem 0.875rem',
                                                color: '#15803d', fontWeight: 600, fontSize: '0.85rem',
                                            }}>
                                                <FiCheckCircle size={14} /> Feedback Submitted
                                            </div>
                                        ) : (
                                            <button
                                                id={`rate-${d.slug}-btn`}
                                                className="btn btn-primary"
                                                style={{ background: color, border: 'none', justifyContent: 'center' }}
                                                onClick={() => { setSelectedDomain(d); setAnswers({}); setGeneralComment(''); }}
                                            >
                                                Rate Service
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {domains.length === 0 && (
                            <div className="empty-state">
                                <FiGrid size={36} style={{ color: 'var(--clr-primary-lt)', marginBottom: '0.75rem' }} />
                                <h3>No services available</h3>
                                <p style={{ color: 'var(--clr-text-3)' }}>No campus services are configured for your profile.</p>
                            </div>
                        )}
                    </>
                ) : (
                    /* Form view */
                    <div style={{ maxWidth: 680, margin: '0 auto' }}>
                        <button
                            type="button"
                            id="back-to-services-btn"
                            className="btn btn-ghost"
                            onClick={() => setSelectedDomain(null)}
                            style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <FiArrowLeft size={14} /> Back to Services
                        </button>

                        <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                            {/* Form header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12,
                                    background: `${DOMAIN_COLORS[selectedDomain.slug] || 'var(--clr-primary)'}14`,
                                    color: DOMAIN_COLORS[selectedDomain.slug] || 'var(--clr-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {DOMAIN_ICONS[selectedDomain.slug] || <FiGrid size={22} />}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.2rem' }}>{selectedDomain.name}</h2>
                                    <p style={{ color: 'var(--clr-text-3)', fontSize: '0.85rem' }}>{selectedDomain.description}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                                    {selectedDomain.questions?.map((q, idx) => (
                                        <div key={q._id}>
                                            <label style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block', marginBottom: '0.75rem', color: 'var(--clr-text-1)' }}>
                                                {idx + 1}. {q.text}
                                                {q.required && <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>}
                                            </label>
                                            {q.type === 'rating' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <StarRating
                                                        value={answers[q._id]?.rating || 0}
                                                        onChange={(val) => handleRating(q._id, val)}
                                                        fieldKey={q._id}
                                                    />
                                                    {answers[q._id]?.rating && (
                                                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                                                            {answers[q._id].rating} / 5
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <textarea
                                                    value={answers[q._id]?.comment || ''}
                                                    onChange={e => handleComment(q._id, e.target.value)}
                                                    placeholder="Your suggestions..."
                                                    rows={3}
                                                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0.75rem', fontSize: '0.9rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>General Comments <span style={{ fontWeight: 400, color: 'var(--clr-text-3)' }}>(Optional)</span></label>
                                    <textarea
                                        value={generalComment}
                                        onChange={e => setGeneralComment(e.target.value)}
                                        placeholder="Any additional feedback or suggestions..."
                                        rows={3}
                                        style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0.75rem', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
                                    />
                                </div>

                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setSelectedDomain(null)}>
                                        Cancel
                                    </button>
                                    <button
                                        id="submit-domain-feedback-btn"
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clr-primary)' }}
                                    >
                                        {submitting ? 'Submitting…' : <><FiCheck size={15} /> Submit Feedback</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DomainFeedback;
