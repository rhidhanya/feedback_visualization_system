import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut, FiCheckCircle, FiEdit3, FiInbox, FiClock, FiAlertCircle, FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

// ── Countdown Timer Component ─────────────────────────────────────────────
const CountdownTimer = ({ deadline }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        if (!deadline) return;

        const calcTime = () => {
            const now = new Date();
            const end = new Date(deadline);
            const diff = end - now;

            if (diff <= 0) {
                setExpired(true);
                setTimeLeft('Deadline passed');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            let str = '';
            if (days > 0) str += `${days}d `;
            if (hours > 0 || days > 0) str += `${hours}h `;
            str += `${mins}m ${secs}s`;
            setTimeLeft(str);
        };

        calcTime();
        const timer = setInterval(calcTime, 1000);
        return () => clearInterval(timer);
    }, [deadline]);

    if (!deadline) return null;

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.75rem', background: expired ? 'var(--clr-danger-lt)' : 'var(--clr-accent-lt)',
            borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
            color: expired ? 'var(--clr-danger)' : 'var(--clr-accent)',
            border: `1px solid ${expired ? 'var(--clr-danger-lt)' : 'var(--clr-accent-lt)'}`,
        }}>
            <FiClock size={13} />
            {expired ? 'Deadline passed' : `Closes in: ${timeLeft}`}
        </div>
    );
};

const StudentHome = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [submitted, setSubmitted] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [myFeedback, setMyFeedback] = useState([]);
    const [settings, setSettings] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [subjRes, submittedRes, histRes, settingsRes] = await Promise.all([
                api.get('/subjects/my'),
                api.get('/feedback/submitted-subjects'),
                api.get('/feedback/my'),
                api.get('/settings'),
            ]);
            setSubjects(subjRes.data.data || []);
            setSubmitted(new Set(submittedRes.data.data || []));
            setMyFeedback(histRes.data.data || []);
            setSettings(settingsRes.data.data);
            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const isFeedbackActive = () => {
        if (!settings) return false;
        if (!settings.isFeedbackOpen) return false;
        const now = new Date();
        if (settings.feedbackStartDate && now < new Date(settings.feedbackStartDate)) return false;
        if (settings.feedbackDeadline && now > new Date(settings.feedbackDeadline)) return false;
        return true;
    };

    const getFeedbackStatusBanner = () => {
        if (!settings) return null;
        if (!settings.isFeedbackOpen) {
            return { type: 'closed', msg: 'Feedback period is currently closed. Check back later.' };
        }
        const now = new Date();
        if (settings.feedbackStartDate && now < new Date(settings.feedbackStartDate)) {
            const start = new Date(settings.feedbackStartDate).toLocaleString();
            return { type: 'upcoming', msg: `Feedback opens on ${start}.` };
        }
        if (settings.feedbackDeadline && now > new Date(settings.feedbackDeadline)) {
            return { type: 'expired', msg: 'Feedback deadline has passed.' };
        }
        return { type: 'open', msg: 'Feedback is open.' };
    };

    const handleLogout = () => { logout(); navigate('/student-login'); };
    const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'ST';

    const doneCount = submitted.size;
    const totalCount = subjects.length;
    const statusInfo = getFeedbackStatusBanner();
    const feedbackActive = isFeedbackActive();

    return (
        <div className="student-layout">
            {/* Topbar */}
            <header className="student-topbar" id="student-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 34, height: 34, background: 'var(--clr-primary-lt)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiBookOpen size={18} color="var(--clr-primary)" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>CampusLens</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>Student Portal</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {settings?.feedbackDeadline && feedbackActive && (
                        <CountdownTimer deadline={settings.feedbackDeadline} />
                    )}
                    <div className="user-chip">
                        <div className="user-avatar">{initials}</div>
                        <span>{user?.name}</span>
                        <span className="badge badge-success" style={{ marginLeft: '0.25rem' }}>
                            Sem {user?.semester}
                        </span>
                    </div>
                    <button id="student-logout-btn" className="btn btn-ghost" onClick={handleLogout} style={{ padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiLogOut size={14} /> Logout
                    </button>
                </div>
            </header>

            <div className="student-content">
                {/* Page Header */}
                <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                    <h2>Your Subjects</h2>
                    <p style={{ color: 'var(--clr-text-3)', marginTop: '0.2rem' }}>
                        {user?.department?.name || 'Department'} &bull; Semester {user?.semester}
                    </p>
                </div>

                {/* Campus Feedback Link */}
                <div style={{ marginBottom: '1.25rem', background: 'var(--clr-primary-lt)', border: '1px solid var(--clr-border)', borderRadius: 10, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <strong style={{ fontSize: '0.88rem' }}>Campus Services Feedback</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)', marginTop: 2 }}>Rate Transport, Mess, Hostel, Sanitation &amp; Hygiene</div>
                    </div>
                    <button onClick={() => navigate('/student/domain-feedback')} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                        Give Feedback
                    </button>
                </div>

                {/* Queries & Support Link */}
                <div style={{ marginBottom: '1.25rem', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: 10, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <strong style={{ fontSize: '0.88rem' }}>Queries & Support</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', marginTop: 2 }}>Raise issues related to campus facilities or track existing queries</div>
                    </div>
                    <button onClick={() => navigate('/student/queries')} className="btn btn-primary" style={{ background: 'var(--clr-accent)', padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                        My Queries
                    </button>
                </div>

                {/* Feedback Status Banner */}
                {statusInfo && statusInfo.type !== 'open' && (
                    <div className={`alert alert-${statusInfo.type === 'closed' || statusInfo.type === 'expired' ? 'danger' : 'warning'}`}
                        style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', borderRadius: 10 }}>
                        <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
                        <div>
                            <strong>Feedback {statusInfo.type === 'open' ? 'Open' : statusInfo.type === 'upcoming' ? 'Upcoming' : 'Closed'}:</strong>{' '}
                            {statusInfo.msg}
                        </div>
                    </div>
                )}

                {feedbackActive && settings?.feedbackDeadline && (
                    <div style={{ marginBottom: '1.25rem', background: 'var(--clr-primary-lt)', border: '1px solid var(--clr-border)', borderRadius: 10, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FiClock size={16} color="var(--clr-primary)" />
                        <div style={{ flex: 1 }}>
                            <strong style={{ color: 'var(--clr-primary)' }}>Feedback is Open</strong>
                            <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)', marginTop: '0.15rem' }}>
                                Deadline: {new Date(settings.feedbackDeadline).toLocaleString()}
                            </div>
                        </div>
                        <CountdownTimer deadline={settings.feedbackDeadline} />
                    </div>
                )}

                {/* Progress Summary */}
                <div className="alert alert-info" id="feedback-progress" style={{ marginBottom: '1.5rem', background: totalCount > 0 && doneCount === totalCount ? '#dcfce7' : '#f0f4f8', border: `1px solid ${totalCount > 0 && doneCount === totalCount ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem' }}>
                    <FiCheckCircle size={16} style={{ flexShrink: 0, color: totalCount > 0 && doneCount === totalCount ? 'var(--clr-success)' : 'var(--clr-accent)' }} />
                    <div style={{ color: totalCount > 0 && doneCount === totalCount ? '#15803d' : 'var(--clr-text-2)' }}>
                        <strong>Feedback Progress:</strong>{' '}
                        {doneCount} of {totalCount} subjects submitted
                        {doneCount === totalCount && totalCount > 0 && ' — All done!'}
                    </div>
                    {totalCount > 0 && (
                        <div style={{ marginLeft: 'auto', height: 6, width: 100, background: 'var(--clr-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(doneCount / totalCount) * 100}%`, background: 'var(--clr-primary)', borderRadius: 3, transition: 'width 0.3s' }} />
                        </div>
                    )}
                </div>

                {error && (
                    <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiAlertCircle size={15} /> {error}
                    </div>
                )}

                {/* My Feedback History */}
                {myFeedback.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                            <FiClock size={16} style={{ color: 'var(--clr-accent)' }} /> Submission History
                        </h3>
                        <div className="table-wrap">
                            <table id="my-feedback-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Subject</th>
                                        <th>Faculty</th>
                                        <th>Rating</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myFeedback.map(fb => (
                                        <tr key={fb._id}>
                                            <td style={{ color: 'var(--clr-text-3)', fontSize: '0.8rem' }}>{fb.subjectId?.subjectCode || 'N/A'}</td>
                                            <td style={{ fontWeight: 600 }}>{fb.subjectId?.name || 'Deleted Subject'}</td>
                                            <td>{fb.subjectId?.faculty?.name || fb.subjectId?.facultyName || 'TBA'}</td>
                                            <td>
                                                <span className={`rating-chip ${fb.overallRating >= 4 ? 'rating-high' : fb.overallRating >= 2.5 ? 'rating-mid' : 'rating-low'}`}>
                                                    {fb.overallRating?.toFixed(1)} / 5
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--clr-text-3)', fontSize: '0.8rem' }}>
                                                {new Date(fb.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Subject Cards */}
                {loading ? (
                    <div className="loading-state"><div className="spinner" /><span>Loading subjects…</span></div>
                ) : subjects.length === 0 ? (
                    <div className="empty-state">
                        <FiInbox size={36} style={{ color: 'var(--clr-primary-lt)', marginBottom: '0.75rem' }} />
                        <h3>No subjects found</h3>
                        <p style={{ color: 'var(--clr-text-3)', marginTop: '0.4rem' }}>
                            No subjects are assigned to {user?.department?.name || 'your department'}, Semester {user?.semester} yet.
                            <br />Contact your administrator to set up subjects.
                        </p>
                    </div>
                ) : (
                    <div className="subjects-grid" id="subjects-grid">
                        {subjects.map(subject => {
                            const isSubmitted = submitted.has(subject._id);
                            const existingFeedback = myFeedback.find(fb =>
                                fb.subjectId?._id === subject._id || fb.subjectId === subject._id
                            );

                            return (
                                <div
                                    key={subject._id}
                                    id={`subject-card-${subject.subjectCode}`}
                                    className={`subject-card${isSubmitted ? ' submitted' : ''}`}
                                >
                                    <div>
                                        <div className="subject-code">{subject.subjectCode}</div>
                                        <div className="subject-name" style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1rem' }}>{subject.name}</div>
                                        <div className="subject-meta" style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--clr-text-2)', fontSize: '0.85rem' }}>
                                                <FiUser size={13} style={{ color: 'var(--clr-primary)' }} />
                                                {subject.faculty?.name || subject.facultyName || 'TBA'}
                                            </div>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--clr-text-3)' }}>
                                                <FiClock size={12} />
                                                {subject.academicYear} &bull; Sem {subject.semester}
                                            </span>
                                        </div>
                                    </div>

                                    {isSubmitted && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#15803d', fontWeight: 600, marginTop: '0.5rem' }}>
                                            <FiCheckCircle size={13} /> Submitted
                                        </div>
                                    )}

                                    <div className="subject-actions" style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
                                        {isSubmitted ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <span className="badge badge-success" style={{ justifyContent: 'center', padding: '0.4rem 0.75rem' }}>
                                                    <FiCheckCircle size={12} style={{ marginRight: '0.25rem' }} /> Feedback Submitted
                                                </span>
                                                {feedbackActive && (
                                                    <button
                                                        className="btn btn-ghost"
                                                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                                                        onClick={() => navigate(`/student/feedback/${subject._id}`, { state: { subject, existingFeedback } })}
                                                    >
                                                        <FiEdit3 size={13} /> Edit Feedback
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                id={`submit-btn-${subject.subjectCode}`}
                                                className="btn btn-primary"
                                                style={{ width: '100%', justifyContent: 'center' }}
                                                onClick={() => navigate(`/student/feedback/${subject._id}`, { state: { subject } })}
                                                disabled={!feedbackActive}
                                                title={!feedbackActive ? 'Feedback period is closed' : ''}
                                            >
                                                <FiEdit3 size={14} /> Submit Feedback
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentHome;
