import React, { useState, useEffect, useCallback } from 'react';
import { } from 'react-router-dom';
import { FiCheckCircle, FiCheck, FiTruck, FiCoffee, FiHome, FiDroplet, FiGrid, FiChevronRight, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StudentLayout from '../../components/StudentLayout';
import './DomainFeedback.css';

const DOMAIN_ICONS = {
    transport: <FiTruck />,
    mess: <FiCoffee />,
    hostel: <FiHome />,
    sanitation: <FiDroplet />,
};

const DomainFeedback = () => {
    const { user } = useAuth();
    const [domains, setDomains] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [answers, setAnswers] = useState({});
    const [generalComment, setGeneralComment] = useState('');
    const [submitted, setSubmitted] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

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
                fetchedDomains = fetchedDomains.filter(d => d.slug !== 'transport');
            } else {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDomain) return;

        const unanswered = selectedDomain.questions.filter(
            q => q.type === 'rating' && q.required && !answers[q._id]?.rating
        );
        if (unanswered.length > 0) {
            setError(`Please answer all required questions.`);
            return;
        }

        setSubmitting(true);
        setError('');
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

            setSelectedDomain(null);
            setAnswers({});
            setGeneralComment('');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const doneCount = submitted.length;
    const progressPercent = domains.length ? (doneCount / domains.length) * 100 : 0;

    if (loading) return (
        <StudentLayout>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div className="spinner" />
            </div>
        </StudentLayout>
    );

    return (
        <StudentLayout>
            <div className="domain-feedback-container">
                {!selectedDomain ? (
                    <>
                        <div className="progress-banner">
                            <div className="progress-text">
                                <h2>Your Campus Experience Matters</h2>
                                <p className="progress-stats">
                                    {doneCount === domains.length ? 'Total perfection! All reviews done.' : `You've reviewed ${doneCount} of ${domains.length} services.`}
                                </p>
                            </div>
                            <div style={{ width: 120, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4 }}>
                                <div style={{ height: '100%', width: `${progressPercent}%`, background: '#fff', borderRadius: 4, transition: 'width 0.5s ease-out' }} />
                            </div>
                        </div>

                        <div className="domain-grid">
                            {domains.map(d => {
                                const isDone = submitted.includes(d.slug);
                                return (
                                    <div 
                                        key={d.slug} 
                                        className="domain-card-premium"
                                        onClick={() => !isDone && setSelectedDomain(d)}
                                    >
                                        <div>
                                            <div className="domain-icon-wrapper">
                                                {DOMAIN_ICONS[d.slug] || <FiGrid size={28} />}
                                            </div>
                                            <h3>{d.name}</h3>
                                            <p>{d.description || 'Provide your feedback on this campus service.'}</p>
                                        </div>
                                        
                                        <div className={`status-badge-premium ${isDone ? 'status-completed' : 'status-pending'}`}>
                                            {isDone ? (
                                                <><FiCheckCircle /> Completed</>
                                            ) : (
                                                <><FiChevronRight /> Start Review</>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="domain-form-view">

                        <div className="domain-form-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                                    <div className="domain-icon-wrapper" style={{ marginBottom: 0, width: '48px', height: '48px' }}>
                                        {DOMAIN_ICONS[selectedDomain.slug] || <FiGrid size={22} />}
                                    </div>
                                    <div>
                                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{selectedDomain.name}</h1>
                                        <p style={{ color: '#64748b', margin: '0.15rem 0 0 0', fontSize: '0.85rem' }}>{selectedDomain.description}</p>
                                    </div>
                                </div>

                            <form onSubmit={handleSubmit}>
                                {selectedDomain.questions?.map((q, idx) => (
                                    <div key={q._id} className="q-row">
                                        <div className="q-text">{idx + 1}. {q.text}</div>
                                        {q.type === 'rating' ? (
                                            <div className="star-rating-large">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span 
                                                        key={star}
                                                        className={`star-input-btn ${answers[q._id]?.rating >= star ? 'active' : ''}`}
                                                        onClick={() => handleRating(q._id, star)}
                                                    >★</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <textarea 
                                                className="comment-textarea"
                                                placeholder="Share your thoughts..."
                                                value={answers[q._id]?.comment || ''}
                                                onChange={(e) => handleComment(q._id, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}

                                <div style={{ marginTop: '1.5rem' }}>
                                    <label className="comment-label">Overall Experience Comments</label>
                                    <textarea 
                                        className="comment-textarea"
                                        placeholder="Any other details you'd like to share..."
                                        value={generalComment}
                                        onChange={(e) => setGeneralComment(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                {error && (
                                    <div className="alert alert-error" style={{ marginTop: '2rem' }}>
                                        <FiAlertTriangle /> {error}
                                    </div>
                                )}

                                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setSelectedDomain(null)} style={{ padding: '0.6rem 1.25rem' }}>Cancel</button>
                                    <button 
                                        type="submit" 
                                        className="btn-submit-feedback"
                                        style={{ width: 'auto', minWidth: '180px', padding: '0.6rem 1.5rem' }}
                                        disabled={submitting}
                                    >
                                        {submitting ? <FiLoader className="spinner-inline" /> : <><FiCheck /> Submit Review</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default DomainFeedback;
