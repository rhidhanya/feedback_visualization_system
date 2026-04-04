import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FiCheckCircle, FiUser, FiAlertTriangle, FiLoader, FiCheck, FiArrowLeft } from 'react-icons/fi';
import api from '../../api/axios';
import StudentLayout from '../../components/StudentLayout';
import './FeedbackForm.css';

const RATING_FIELDS = [
    { key: 'teachingQuality', label: 'Teaching Quality', desc: 'Clarity of explanations and delivery' },
    { key: 'communication', label: 'Communication', desc: 'Interaction and approachability' },
    { key: 'punctuality', label: 'Punctuality', desc: 'Timeliness and class regularity' },
    { key: 'subjectKnowledge', label: 'Subject Knowledge', desc: 'Depth of subject mastery' },
    { key: 'doubtClarification', label: 'Doubt Clarification', desc: 'Effectiveness in resolving doubts' },
];

const FeedbackForm = () => {
    const { subjectId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    const [subject, setSubject] = useState(state?.subject || null);
    const existingFeedback = state?.existingFeedback;

    const [ratings, setRatings] = useState(
        existingFeedback?.ratings || Object.fromEntries(RATING_FIELDS.map(f => [f.key, 0]))
    );
    const [comments, setComments] = useState(existingFeedback?.comments || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(!subject);

    useEffect(() => {
        if (!subject && subjectId) {
            const fetchSubject = async () => {
                try {
                    const res = await api.get(`/subjects/${subjectId}`);
                    if (res.data.success) {
                        setSubject(res.data.data);
                    }
                } catch (err) {
                    console.error("Failed to fetch subject:", err);
                    setError("Could not load subject details.");
                } finally {
                    setLoading(false);
                }
            };
            fetchSubject();
        }
    }, [subjectId, subject]);

    const allFilled = Object.values(ratings).every(v => v > 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!allFilled) { setError('Please rate all categories before submitting.'); return; }
        setSubmitting(true);
        setError('');
        try {
            if (existingFeedback) {
                await api.put(`/feedback/${existingFeedback._id}`, { ratings, comments });
            } else {
                await api.post('/feedback', { subjectId, ratings, comments });
            }
            setSuccess(true);
            setTimeout(() => navigate('/student/home'), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <StudentLayout>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div className="spinner" />
            </div>
        </StudentLayout>
    );

    if (success) {
        return (
            <StudentLayout>
                <div className="success-overlay">
                    <div className="success-icon">
                        <FiCheckCircle size={48} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Feedback Submitted!</h2>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '1rem' }}>
                        Thank you for your valuable feedback.<br />Redirecting you back home...
                    </p>
                    <div className="spinner" style={{ margin: '2rem auto 0' }} />
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="feedback-page">
                <div className="feedback-header-card">
                    <div className="subject-info">
                        <h1>{subject?.name}</h1>
                        <div className="faculty-badge">
                            <FiUser size={18} style={{ color: 'var(--clr-primary)' }} />
                            <span>{subject?.facultyName || subject?.faculty?.name}</span>
                            <span style={{ color: 'var(--clr-border-2)' }}>•</span>
                            <span style={{ color: 'var(--clr-text-3)' }}>{subject?.subjectCode}</span>
                        </div>
                    </div>
                </div>

                <div className="rating-container">
                    <form onSubmit={handleSubmit}>
                        <div className="rating-group">
                            {RATING_FIELDS.map(field => (
                                <div key={field.key} className="rating-item">
                                    <div className="rating-label-box">
                                        <div className="rating-title">{field.label}</div>
                                        <div className="rating-desc">{field.desc}</div>
                                    </div>
                                    <div className="star-input">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span 
                                                key={star}
                                                className={`star-btn ${ratings[field.key] >= star ? 'active' : ''}`}
                                                onClick={() => setRatings(prev => ({ ...prev, [field.key]: star }))}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="comment-section">
                            <label className="comment-label">Additional Comments (Optional)</label>
                            <textarea 
                                className="comment-textarea"
                                placeholder="Tell us more about your experience with this faculty..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                maxLength={1000}
                            />
                        </div>

                        {error && (
                            <div className="alert alert-error" style={{ marginTop: '1.5rem', background: 'var(--clr-danger-lt)', color: 'var(--clr-danger)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--clr-danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                                <FiAlertTriangle /> {error}
                            </div>
                        )}

                        <div className="submit-section">
                            <button 
                                type="submit" 
                                className="btn-submit-feedback"
                                disabled={submitting || !allFilled}
                            >
                                {submitting ? <FiLoader className="spinner-inline" /> : <FiCheck size={20} />}
                                {existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                            </button>
                            {!allFilled && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-3)', fontWeight: 600, marginTop: '0.5rem' }}>
                                    Please provide all ratings to continue
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </StudentLayout>
    );
};

export default FeedbackForm;
