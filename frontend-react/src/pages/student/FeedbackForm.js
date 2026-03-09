import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FiCheckCircle, FiBook, FiUser, FiAlertTriangle, FiLoader, FiCheck } from 'react-icons/fi';
import api from '../../api/axios';

const RATING_FIELDS = [
    { key: 'teachingQuality', label: 'Teaching Quality', desc: 'Clarity of explanations and delivery' },
    { key: 'communication', label: 'Communication', desc: 'Interaction and approachability' },
    { key: 'punctuality', label: 'Punctuality', desc: 'Timeliness and class regularity' },
    { key: 'subjectKnowledge', label: 'Subject Knowledge', desc: 'Depth of subject mastery' },
    { key: 'doubtClarification', label: 'Doubt Clarification', desc: 'Effectiveness in resolving doubts' },
];

const StarRating = ({ value, onChange, fieldKey }) => (
    <div className="stars" id={`stars-${fieldKey}`}>
        {[1, 2, 3, 4, 5].map(star => (
            <span
                key={star}
                id={`star-${fieldKey}-${star}`}
                className={`star${value >= star ? ' active' : ''}`}
                onClick={() => onChange(star)}
                title={`${star} star${star > 1 ? 's' : ''}`}
            >
                ★
            </span>
        ))}
    </div>
);

const FeedbackForm = () => {
    const { subjectId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    const subject = state?.subject;
    const existingFeedback = state?.existingFeedback;

    const [ratings, setRatings] = useState(
        existingFeedback?.ratings || Object.fromEntries(RATING_FIELDS.map(f => [f.key, 0]))
    );
    const [comments, setComments] = useState(existingFeedback?.comments || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const avgPreview = (() => {
        const vals = Object.values(ratings).filter(v => v > 0);
        if (vals.length === 0) return null;
        return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
    })();

    const allFilled = Object.values(ratings).every(v => v > 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!allFilled) { setError('Please rate all 5 categories before submitting.'); return; }
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

    if (success) {
        return (
            <div className="student-layout">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '100vh' }}>
                    <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <FiCheckCircle size={56} style={{ color: 'var(--clr-accent)' }} />
                        </div>
                        <h2>Feedback Submitted!</h2>
                        <p>Thank you for your feedback. Redirecting to home...</p>
                        <div className="spinner" style={{ margin: '1.5rem auto 0' }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="student-layout">
            <header className="student-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        id="back-btn"
                        className="btn btn-ghost"
                        onClick={() => navigate('/student/home')}
                        style={{ padding: '0.4rem 0.75rem' }}
                    >
                        ← Back
                    </button>
                    <div>
                        <div style={{ fontWeight: 700 }}>{existingFeedback ? 'Edit Feedback' : 'Submit Feedback'}</div>
                        {subject && <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>{subject.subjectCode} · {subject.name}</div>}
                    </div>
                </div>
            </header>

            <div className="student-content">
                {subject && (
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: 'var(--clr-primary-lt)', borderRadius: 8 }}>
                                <FiBook size={20} style={{ color: 'var(--clr-primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{subject.name}</div>
                                <div style={{ color: 'var(--clr-text-3)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {subject.subjectCode}
                                    <span style={{ color: 'var(--clr-border-2)' }}>·</span>
                                    <FiUser size={12} style={{ verticalAlign: 'middle' }} />
                                    {subject.facultyName}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form className="card feedback-form" id="feedback-form" onSubmit={handleSubmit}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Rate Your Faculty</h3>

                    {error && (
                        <div className="alert alert-error" id="form-error" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FiAlertTriangle size={14} style={{ flexShrink: 0 }} />{error}
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                        {RATING_FIELDS.map(field => (
                            <div key={field.key} className="rating-row">
                                <div className="rating-label">
                                    {field.label}
                                    <span>{field.desc}</span>
                                </div>
                                <StarRating
                                    fieldKey={field.key}
                                    value={ratings[field.key]}
                                    onChange={val => setRatings(p => ({ ...p, [field.key]: val }))}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Live preview */}
                    {avgPreview && (
                        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ color: 'var(--clr-text-3)', fontSize: '0.875rem' }}>Preview rating:</span>
                            <span className={`rating-chip ${Number(avgPreview) >= 4 ? 'rating-high' : Number(avgPreview) >= 2.5 ? 'rating-mid' : 'rating-low'}`}>
                                {avgPreview}
                            </span>
                        </div>
                    )}

                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Comments (Optional)</label>
                        <textarea
                            id="comments-input"
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                            placeholder="Share your experience with this faculty (max 1000 characters)…"
                            rows={4}
                            maxLength={1000}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)', marginTop: '0.25rem' }}>
                            {comments.length}/1000
                        </span>
                    </div>

                    <button
                        id="submit-feedback-btn"
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={submitting || !allFilled}
                    >
                        {submitting
                            ? <><FiLoader size={14} style={{ marginRight: '0.4rem' }} />Submitting…</>
                            : <><FiCheck size={14} style={{ marginRight: '0.4rem' }} />{existingFeedback ? 'Update Feedback' : 'Submit Feedback'}</>
                        }
                    </button>

                    {!allFilled && (
                        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--clr-text-3)', marginTop: '0.75rem' }}>
                            Please rate all 5 categories to enable submission.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default FeedbackForm;
