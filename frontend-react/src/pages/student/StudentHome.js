import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiCheckCircle, FiEdit3, FiInbox, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StudentLayout from '../../components/StudentLayout';
import './StudentHome.css';

const StudentHome = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [submitted, setSubmitted] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [, setMyFeedback] = useState([]);
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

    const doneCount = submitted.size;
    const totalCount = subjects.length;
    const feedbackActive = isFeedbackActive();

    return (
        <StudentLayout deadline={settings?.feedbackDeadline} isFeedbackActive={feedbackActive}>
            <div className="student-home-container">
                <header className="student-header">
                    <h1>Your Subjects</h1>
                    <p>{user?.department?.name || 'Department'} &bull; Semester {user?.semester}</p>
                </header>

                <div className="services-grid">
                    <div className="service-card campus">
                        <div className="service-info">
                            <h3>Campus Services</h3>
                            <p>Rate Mess, Transport, Hostel, etc.</p>
                        </div>
                        <button onClick={() => navigate('/student/domain-feedback')} className="btn-service btn-campus">
                            Give Feedback
                        </button>
                    </div>

                    <div className="service-card queries">
                        <div className="service-info">
                            <h3>Queries & Support</h3>
                            <p>Raise issues or ask questions.</p>
                        </div>
                        <button onClick={() => navigate('/student/queries')} className="btn-service btn-queries" style={{ background: '#5851db' }}>
                            My Queries
                        </button>
                    </div>
                </div>

                <div className="progress-section">
                    <div className="progress-header">
                        <FiCheckCircle size={20} color="#1e4db7" />
                        <span>Feedback Progress: {doneCount} of {totalCount} subjects submitted</span>
                    </div>
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar-fill" 
                            style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
                        <FiAlertCircle size={16} /> {error}
                    </div>
                )}

                {subjects.length === 0 && !loading ? (
                    <div className="empty-state">
                        <FiInbox size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                        <h3>No subjects found</h3>
                        <p>You don't have any subjects assigned for this semester yet.</p>
                    </div>
                ) : (
                    <div className="subjects-grid">
                        {subjects.map(subject => {
                            const isSubmitted = submitted.has(subject._id);
                            return (
                                <div key={subject._id} className="subject-card">
                                    <div className="subject-top">
                                        <div className="subject-code">{subject.subjectCode}</div>
                                        <h2 className="subject-name">{subject.name}</h2>
                                        <div className="subject-faculty">
                                            <FiUser size={16} /> {subject.facultyName || 'TBA'}
                                        </div>
                                    </div>

                                    <div className="subject-bottom">
                                        {isSubmitted && (
                                            <div className="status-badge">
                                                <FiCheckCircle size={16} /> Submitted
                                            </div>
                                        )}
                                        {isSubmitted ? (
                                            feedbackActive && (
                                                <button 
                                                    className="btn-feedback btn-feedback-secondary" 
                                                    onClick={() => navigate(`/student/feedback/${subject._id}`)}
                                                >
                                                    <FiEdit3 size={16} /> Edit Feedback
                                                </button>
                                            )
                                        ) : (
                                            <button 
                                                className="btn-feedback btn-feedback-primary" 
                                                onClick={() => navigate(`/student/feedback/${subject._id}`)}
                                                disabled={!feedbackActive}
                                            >
                                                <FiEdit3 size={16} /> Give Feedback
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentHome;
