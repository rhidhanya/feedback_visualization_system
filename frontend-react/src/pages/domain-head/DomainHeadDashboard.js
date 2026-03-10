import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import { FiMessageSquare, FiStar, FiAlertTriangle, FiCheckCircle, FiBell, FiInbox } from 'react-icons/fi';
import DomainHeadLayout from '../../components/DomainHeadLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import IssueAlert from '../../components/IssueAlert';
import MessagePortal from '../../components/MessagePortal';


const DomainHeadDashboard = () => {
    const { user } = useAuth();
    const domain = user?.assignedDomain;
    const [analytics, setAnalytics] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [issues, setIssues] = useState([]);
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('issues'); // 'issues' or 'queries'
    const socketRef = useRef(null);

    const fetchAll = useCallback(async () => {
        if (!domain) return;
        setLoading(true);
        try {
            const [anRes, notifRes, issRes, qRes] = await Promise.all([
                api.get(`/domain-feedback/analytics/${domain}`),
                api.get('/notifications/my'),
                api.get(`/issues?domain=${domain}`),
                api.get(`/queries`), // Filtered by domain on backend
            ]);
            setAnalytics(anRes.data.data);
            setNotifications(notifRes.data.data || []);
            setIssues(issRes.data.data || []);
            setQueries(qRes.data.data || []);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    }, [domain]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        if (!domain) return;
        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', { transports: ['websocket'] });
        socketRef.current = socket;
        socket.emit('joinDomainRoom', domain);
        socket.on('domainFeedbackUpdated', fetchAll);
        socket.on('newNotification', fetchAll);
        return () => socket.disconnect();
    }, [domain, fetchAll]);

    const markRead = async (id) => {
        await api.put(`/notifications/${id}/read`);
        fetchAll();
    };

    const updateStatus = async (id, status) => {
        await api.put(`/issues/${id}/status`, { status });
        fetchAll();
    };

    const updateQueryStatus = async (id, status) => {
        await api.put(`/queries/${id}`, { status });
        fetchAll();
    };

    if (loading) return (
        <DomainHeadLayout title="Dashboard">
            <div className="loading-state"><div className="spinner" /><span>Loading dashboard…</span></div>
        </DomainHeadLayout>
    );

    const an = analytics || {};
    const questionChart = an.questionStats?.length ? {
        labels: an.questionStats.map(q => q.question?.slice(0, 35) + (q.question?.length > 35 ? '…' : '')),
        datasets: [{ label: 'Avg Rating', data: an.questionStats.map(q => q.avgRating), backgroundColor: '#0ABAB5', borderRadius: 8, barThickness: 20 }],
    } : null;

    const trendChart = an.semesterTrend?.length ? {
        labels: an.semesterTrend.map(t => `Sem ${t.semester}`),
        datasets: [{ 
            label: 'Avg Rating', 
            data: an.semesterTrend.map(t => t.avgRating), 
            borderColor: '#006994', 
            backgroundColor: 'rgba(0, 105, 148, 0.1)', 
            fill: true, 
            tension: 0.4, 
            pointRadius: 5, 
            pointBackgroundColor: '#006994' 
        }],
    } : null;

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const pendingIssues = issues.filter(i => i.status === 'Pending' || i.status === 'In Progress').length;

    return (
        <DomainHeadLayout title={`${domain?.charAt(0).toUpperCase() + domain?.slice(1)} Dashboard`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div></div> {/* Spacer */}
                <IssueAlert role="domain_head" domainContext={domain} />
            </div>

            {/* KPIs */}
            <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                <KPI icon={<FiMessageSquare size={18} />} label="Total Feedback" value={an.totalFeedback ?? 0} color="#0ABAB5" />
                <KPI icon={<FiStar size={18} />} label="Avg Rating" value={`${an.avgRating?.toFixed(2) ?? '—'} / 5`} color="#006994" />
                <KPI icon={<FiAlertTriangle size={18} />} label="Negative (≤2★)" value={an.negativeFeedback ?? 0} color="#dc2626" />
                <KPI icon={<FiBell size={18} />} label="Unread Alerts" value={unreadCount} color="#9BC4E2" />
            </div>

            {/* Charts */}
            <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="chart-card">
                    <div className="chart-card-header"><h3>Question-wise Ratings</h3></div>
                    <div style={{ height: 280 }}>
                        {questionChart ? <Bar data={questionChart} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { min: 0, max: 5 } } }} /> : <Empty />}
                    </div>
                </div>
                <div className="chart-card">
                    <div className="chart-card-header"><h3>Semester Trend</h3></div>
                    <div style={{ height: 280 }}>
                        {trendChart ? <Line data={trendChart} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 5 } } }} /> : <Empty />}
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {/* Lower Section: Alerts & Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }}>
                {/* Left: Notifications */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3><FiBell size={14} style={{ marginRight: 6 }} />Notifications ({unreadCount})</h3>
                    </div>
                    <div style={{ maxHeight: 600, overflowY: 'auto', padding: '0.75rem' }}>
                        {notifications.length === 0 ? <Empty /> : notifications.slice(0, 15).map(n => (
                            <div key={n._id} style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', background: n.isRead ? '#fff' : '#f0f9ff', borderRadius: 6, marginBottom: 4 }}>
                                <strong style={{ fontSize: '0.85rem' }}>{n.title}</strong>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0' }}>{n.message}</p>
                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#94a3b8' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                                    {!n.isRead && <button onClick={() => markRead(n._id)} style={{ color: 'var(--clr-accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Mark Read</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Issues & Student Queries (Tabs) */}
                <div className="chart-card">
                    <div className="chart-card-header" style={{ padding: 0 }}>
                        <div style={{ display: 'flex' }}>
                            <button
                                onClick={() => setActiveTab('issues')}
                                style={{ flex: 1, padding: '1rem', border: 'none', background: activeTab === 'issues' ? '#fff' : '#f8fafc', borderBottom: activeTab === 'issues' ? '2px solid var(--clr-primary)' : '1px solid #e2e8f0', color: activeTab === 'issues' ? 'var(--clr-primary)' : '#64748b', fontWeight: 700, cursor: 'pointer' }}
                            >
                                System Issues ({pendingIssues})
                            </button>
                            <button
                                onClick={() => setActiveTab('queries')}
                                style={{ flex: 1, padding: '1rem', border: 'none', background: activeTab === 'queries' ? '#fff' : '#f8fafc', borderBottom: activeTab === 'queries' ? '2px solid var(--clr-primary)' : '1px solid #e2e8f0', color: activeTab === 'queries' ? 'var(--clr-primary)' : '#64748b', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Student Queries ({queries.filter(q => q.status !== 'Rectified' && q.status !== 'Resolved').length})
                            </button>
                        </div>
                    </div>

                    <div style={{ maxHeight: 535, overflowY: 'auto', padding: '1rem' }}>
                        {activeTab === 'issues' ? (
                            issues.length === 0 ? <Empty /> : issues.map(iss => (
                                <div key={iss._id} style={{ padding: '1rem', border: '1px solid #f1f5f9', borderRadius: 12, marginBottom: '0.75rem', background: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>{iss.notificationId?.title || 'Feedback Alert'}</h4>
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>{iss.notificationId?.message}</p>
                                        </div>
                                        <StatusBadge status={iss.status} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {['In Progress', 'Rectified', 'Closed'].map(s => (
                                            iss.status !== s && (
                                                <button key={s} onClick={() => updateStatus(iss._id, s)}
                                                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid #e2e8f0', background: s === 'Rectified' ? '#f0fdf4' : '#fff', color: s === 'Rectified' ? '#16a34a' : '#475569', cursor: 'pointer', fontWeight: 600 }}>
                                                    {s === 'Rectified' && <FiCheckCircle size={12} style={{ marginRight: 4 }} />}
                                                    Mark {s}
                                                </button>
                                            )
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            queries.length === 0 ? <Empty /> : queries.map(q => (
                                <div key={q._id} style={{ padding: '1rem', border: '1px solid #f1f5f9', borderRadius: 12, marginBottom: '0.75rem', background: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--clr-primary)', background: 'var(--clr-primary-lt)', padding: '2px 8px', borderRadius: 4 }}>{q.subject}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(q.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>{q.description}</p>
                                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Raised by: {q.student?.name} ({q.student?.rollNumber})</p>
                                        </div>
                                        <StatusBadge status={q.status} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {['In Progress', 'Rectified', 'Resolved'].map(s => (
                                            q.status !== s && (
                                                <button key={s} onClick={() => updateQueryStatus(q._id, s)}
                                                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid #e2e8f0', background: s === 'Rectified' ? '#f0fdf4' : '#fff', color: s === 'Rectified' ? '#16a34a' : '#475569', cursor: 'pointer', fontWeight: 600 }}>
                                                    {s === 'Rectified' && <FiCheckCircle size={12} style={{ marginRight: 4 }} />}
                                                    Mark {s}
                                                </button>
                                            )
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <MessagePortal currentUserRole="domain_head" availableRoles={['admin', 'principal']} domainContext={domain} />
            </div>
        </DomainHeadLayout>
    );
};

const KPI = ({ icon, label, value, color }) => (
    <div className="kpi-card" style={{ '--kpi-color': color }}>
        <div className="kpi-icon" style={{ background: `${color}18`, color }}>{icon}</div>
        <div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value" style={{ color }}>{value}</div>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const colors = { Pending: '#0ABAB5', 'In Progress': '#9BC4E2', Rectified: '#006994', Closed: '#94a3b8' };
    return <span style={{ background: `${colors[status]}18`, color: colors[status], padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600 }}>{status}</span>;
};

const Empty = () => (
    <div className="empty-state"><FiInbox size={28} style={{ color: 'var(--clr-primary-lt)', marginBottom: '0.5rem' }} /><span>No data yet</span></div>
);

export default DomainHeadDashboard;
