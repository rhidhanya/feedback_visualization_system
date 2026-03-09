import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import { FiMessageSquare, FiStar, FiAlertTriangle, FiCheckCircle, FiInbox } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

const AdminDomainDashboard = () => {
    const { domainSlug } = useParams();
    const domain = domainSlug;
    const [analytics, setAnalytics] = useState(null);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);

    const fetchAll = useCallback(async () => {
        if (!domain) return;
        setLoading(true);
        try {
            const [anRes, issRes] = await Promise.all([
                api.get(`/domain-feedback/analytics/${domain}`),
                // Admin might fetch notifications sent TO this domain's head, or maybe skip notifications/mark-read here
                // We'll skip fetching notifications or just fetch issues for this domain
                api.get(`/issues?domain=${domain}`),
            ]);
            setAnalytics(anRes.data.data);
            setIssues(issRes.data.data || []);
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
        return () => socket.disconnect();
    }, [domain, fetchAll]);

    if (loading) return (
        <AdminLayout title={`${domain?.charAt(0).toUpperCase() + domain?.slice(1)} Dashboard`}>
            <div className="loading-state"><div className="spinner" /><span>Loading {domain} dashboard…</span></div>
        </AdminLayout>
    );

    const an = analytics || {};
    const questionChart = an.questionStats?.length ? {
        labels: an.questionStats.map(q => q.question?.slice(0, 35) + (q.question?.length > 35 ? '…' : '')),
        datasets: [{ label: 'Avg Rating', data: an.questionStats.map(q => q.avgRating), backgroundColor: 'var(--clr-primary)', borderRadius: 5 }],
    } : null;

    const trendChart = an.semesterTrend?.length ? {
        labels: an.semesterTrend.map(t => `Sem ${t.semester}`),
        datasets: [{ label: 'Avg Rating', data: an.semesterTrend.map(t => t.avgRating), borderColor: 'var(--clr-accent)', backgroundColor: 'var(--clr-primary-lt)', fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: 'var(--clr-accent)' }],
    } : null;

    const pendingIssues = issues.filter(i => i.status === 'Pending' || i.status === 'In Progress').length;

    return (
        <AdminLayout title={`${domain?.charAt(0).toUpperCase() + domain?.slice(1)} Dashboard`}>
            {/* KPIs */}
            <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                <KPI icon={<FiMessageSquare size={18} />} label="Total Feedback" value={an.totalFeedback ?? 0} color="var(--clr-primary)" />
                <KPI icon={<FiStar size={18} />} label="Avg Rating" value={`${an.avgRating?.toFixed(2) ?? '—'} / 5`} color="var(--clr-accent)" />
                <KPI icon={<FiAlertTriangle size={18} />} label="Negative (≤2★)" value={an.negativeFeedback ?? 0} color="#dc2626" />
                <KPI icon={<FiCheckCircle size={18} />} label="Pending Issues" value={pendingIssues} color="#f59e0b" />
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

            {/* Issues tracking for Admin view */}
            <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
                <div className="chart-card-header"><h3><FiCheckCircle size={14} style={{ marginRight: 6 }} />Domain Issues Tracked</h3></div>
                <div style={{ maxHeight: 300, overflowY: 'auto', padding: '0.75rem' }}>
                    {issues.length === 0 ? <Empty /> : issues.map(iss => (
                        <div key={iss._id} style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '0.85rem' }}>{iss.notificationId?.title || 'Reported Issue'}</strong>
                                <StatusBadge status={iss.status} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
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
    const colors = { Pending: 'var(--clr-primary)', 'In Progress': 'var(--clr-accent)', Rectified: 'var(--clr-success)', Closed: 'var(--clr-text-3)' };
    return <span style={{ background: `${colors[status]}18`, color: colors[status], padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600 }}>{status}</span>;
};

const Empty = () => (
    <div className="empty-state"><FiInbox size={28} style={{ color: '#A7C7E7', marginBottom: '0.5rem' }} /><span>No data yet</span></div>
);

export default AdminDomainDashboard;
