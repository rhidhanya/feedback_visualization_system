import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import { FiMessageSquare, FiStar, FiAlertTriangle, FiBell, FiInbox } from 'react-icons/fi';
import DomainHeadLayout from '../../components/DomainHeadLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import IssueAlert from '../../components/IssueAlert';
import { API_CONFIG } from '../../config';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler
);


const DomainHeadDashboard = () => {
    const { user } = useAuth();
    const domain = user?.assignedDomain;
    const [analytics, setAnalytics] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: 'var(--clr-text)', font: { family: 'Inter', size: 12, weight: 600 } } },
            tooltip: {
                backgroundColor: '#FFFFFF',
                titleColor: '#000000',
                bodyColor: '#334155',
                borderColor: 'var(--clr-border)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 4,
            }
        },
        scales: {
            y: {
                min: 0,
                max: 5,
                ticks: { color: 'var(--clr-text-2)', font: { family: 'Inter', size: 11, weight: 600 } },
                grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false }
            },
            x: {
                ticks: { color: 'var(--clr-text-2)', font: { family: 'Inter', size: 11, weight: 600 } },
                grid: { display: false }
            }
        },
        layout: {
            padding: { left: 10, right: 10, top: 10, bottom: 10 }
        }
    };

    const fetchAll = useCallback(async () => {
        if (!domain) return;
        setLoading(true);
        try {
            const [anRes, notifRes] = await Promise.all([
                api.get(`/domain-feedback/analytics/${domain}`),
                api.get('/notifications/my'),
            ]);
            setAnalytics(anRes.data.data);
            setNotifications(notifRes.data.data || []);
            // setIssues(issRes.data.data || []); 
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    }, [domain]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        if (!domain) return;
        const socket = io(API_CONFIG.SOCKET_URL, { transports: ['websocket'] });
        socketRef.current = socket;
        socket.emit('joinDomainRoom', domain);
        socket.on('domainFeedbackUpdated', fetchAll);
        socket.on('newNotification', fetchAll);
        return () => socket.disconnect();
    }, [domain, fetchAll]);

    if (loading && !analytics) return (
        <DomainHeadLayout title={`${domain?.charAt(0).toUpperCase() + domain?.slice(1)} Dashboard`}>
            <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
            </div>
            <div className="charts-grid">
                {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '350px', borderRadius: '12px' }} />)}
            </div>
        </DomainHeadLayout>
    );

    const an = analytics || {};
    const questionChart = an.questionStats?.length ? {
        labels: an.questionStats.map(q => q.question?.slice(0, 35) + (q.question?.length > 35 ? '…' : '')),
        datasets: [{ label: 'Avg Rating', data: an.questionStats.map(q => q.avgRating), backgroundColor: 'var(--clr-primary)', borderRadius: 8, barThickness: 20 }],
    } : null;

    const trendChart = an.semesterTrend?.length ? {
        labels: an.semesterTrend.map(t => `Sem ${t.semester}`),
        datasets: [{ 
            label: 'Avg Rating', 
            data: an.semesterTrend.map(t => t.avgRating), 
            borderColor: 'var(--clr-primary)', 
            backgroundColor: 'rgba(30, 77, 183, 0.1)', 
            fill: true, 
            tension: 0.4, 
            pointRadius: 5, 
            pointBackgroundColor: 'var(--clr-primary)' 
        }],
    } : null;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <DomainHeadLayout title={`${domain?.charAt(0).toUpperCase() + domain?.slice(1)} Dashboard`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Overview</h2>
                <IssueAlert role="domain_head" domainContext={domain} />
            </div>

            {/* KPIs */}
            <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                <KPI icon={<FiMessageSquare size={18} />} label="Total Feedback" value={an.totalFeedback ?? 0} color="var(--clr-primary)" />
                <KPI icon={<FiStar size={18} />} label="Avg Rating" value={`${an.avgRating?.toFixed(2) ?? '—'} / 5`} color="var(--clr-accent)" />
                <KPI icon={<FiAlertTriangle size={18} />} label="Negative (≤2★)" value={an.negativeFeedback ?? 0} color="#dc2626" />
                <KPI icon={<FiBell size={18} />} label="Unread Alerts" value={unreadCount} color="#64748b" />
            </div>

            {/* Charts */}
            <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="chart-card">
                    <div className="chart-card-header"><h3>Question-wise Ratings</h3></div>
                    <div style={{ height: 320 }}>
                        {questionChart ? <Bar data={questionChart} options={{ ...chartOptions, indexAxis: 'y', scales: { ...chartOptions.scales, x: { ...chartOptions.scales.y, grid: { color: 'var(--clr-chart-grid)' } }, y: { ...chartOptions.scales.x, grid: { display: false } } } }} /> : <Empty />}
                    </div>
                </div>
                <div className="chart-card">
                    <div className="chart-card-header"><h3>Semester Trend</h3></div>
                    <div style={{ height: 320 }}>
                        {trendChart ? <Line data={trendChart} options={chartOptions} /> : <Empty />}
                    </div>
                </div>
            </div>
        </DomainHeadLayout>
    );
};

const KPI = ({ icon, label, value, color }) => (
    <div className="card-premium kpi-card-item" style={{ borderLeft: `4px solid ${color}` }}>
        <div className="icon-box" style={{ background: `${color}15`, color: color }}>{icon}</div>
        <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--clr-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--clr-text)' }}>{value}</div>
        </div>
    </div>
);

const Empty = () => (
    <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
        <FiInbox size={32} style={{ color: 'var(--clr-primary-lt)', marginBottom: '0.5rem' }} />
        <span style={{ fontWeight: 600 }}>No data yet</span>
    </div>
);

export default DomainHeadDashboard;
