import React, { useState, useEffect, useCallback } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { FiTrendingUp, FiMessageSquare, FiStar, FiAlertTriangle, FiActivity, FiBook, FiTruck, FiCoffee, FiHome, FiShield, FiUser, FiMail } from 'react-icons/fi';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import AdminLayout from '../../components/AdminLayout';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    Filler
);

const DOMAIN_HEADS = {
    mess: { name: "Ms. Sunita Sharma", email: "mess-manager@bitsathy.in", role: "Mess Manager" },
    sanitation: { name: "Ms. Kavitha Nair", email: "sanitation-head@bitsathy.in", role: "Sanitation Head" },
    hostel: { name: "Mr. Anil Mehta", email: "hostel-manager@bitsathy.in", role: "Hostel Manager" },
    transport: { name: "Mr. Ravi Kumar", email: "transport-head@bitsathy.in", role: "Transport Head" },
    academics: { name: "Institutional Head", email: "principal@bitsathy.in", role: "Principal" }
};

const PrincipalDashboard = () => {
    const { user, logout } = useAuth();
    const [activeDomain, setActiveDomain] = useState('academics'); // academics, transport, mess, hostel, sanitation
    const [data, setData] = useState(null);
    const [domainData, setDomainData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMessages, setShowMessages] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);

    const fetchMessagesCount = useCallback(async () => {
        try {
            const res = await api.get('/messages/unread/count');
            setUnreadMessages(res.data.count || 0);
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    }, []);

    useEffect(() => {
        fetchMessagesCount();
        const interval = setInterval(fetchMessagesCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [fetchMessagesCount]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            if (activeDomain === 'academics') {
                const [sumRes, deptRes, trendRes, distRes, facRes] = await Promise.all([
                    api.get('/analytics/summary'),
                    api.get('/analytics/by-department'),
                    api.get('/analytics/trend'),
                    api.get('/analytics/distribution'),
                    api.get('/analytics/by-faculty')
                ]);
                setData({
                    summary: sumRes.data.data,
                    byDepartment: deptRes.data.data || [],
                    trend: trendRes.data.data || [],
                    distribution: distRes.data.data || [],
                    faculty: facRes.data.data || [],
                });
            } else {
                const res = await api.get(`/domain-feedback/analytics/${activeDomain}`);
                setDomainData(res.data.data);
            }
            // last update removed
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, [activeDomain]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const deptChartData = data?.byDepartment?.length ? {
        labels: data.byDepartment.map(d => d.deptCode),
        datasets: [{
            label: 'Avg Rating',
            data: data.byDepartment.map(d => d.avgRating),
            backgroundColor: data.byDepartment.map((_, i) => ['#1E4DB7', '#3B82F6', '#60A5FA', '#94A3B8'][i % 4]),
            borderRadius: 8,
        }]
    } : { labels: [], datasets: [] };

    const participationData = {
        labels: ['Responded', 'Not Responded'],
        datasets: [{
            data: [data?.summary?.totalFeedback || 0, (data?.summary?.totalStudents || 0) - (data?.summary?.totalFeedback || 0)],
            backgroundColor: ['#1E4DB7', '#CBD5E1'], 
            hoverOffset: 4
        }]
    };

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
                grid: { color: 'var(--clr-chart-grid)' }
            },
            x: {
                ticks: { color: 'var(--clr-text-2)', font: { family: 'Inter', size: 11, weight: 600 } },
                grid: { display: false }
            }
        },
        layout: {
            padding: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            }
        }
    };

    const summary = data?.summary || {};

    const trendData = activeDomain === 'academics' ? {
        labels: data?.trend?.map((t, i) => t.label || `Sem ${t.semester}`) || [],
        datasets: [{
            label: 'Avg Rating Trend',
            data: data?.trend?.map(t => t.avgRating || 0) || [],
            borderColor: '#1E4DB7', 
            backgroundColor: 'rgba(30, 77, 183, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#1E4DB7',
        }]
    } : {
        labels: domainData?.semesterTrend?.map(t => `Sem ${t.semester}`) || [],
        datasets: [{
            label: 'Avg Rating',
            data: domainData?.semesterTrend?.map(t => t.avgRating) || [],
            borderColor: '#1E4DB7', 
            backgroundColor: 'rgba(30, 77, 183, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#1E4DB7',
        }]
    };

    return (
        <AdminLayout title="Principal Dashboard" noSidebar={true}>
            {/* Header */}
            <div className="dash-header">
                <div>
                    <h2>Welcome Dr. {user.name}</h2>
                    <p>Institutional Head</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowMessages(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clr-primary)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--clr-hover-bg)'; e.currentTarget.style.color = 'var(--clr-hover-text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--clr-primary)'; e.currentTarget.style.color = '#fff'; }}
                    >
                        <FiMessageSquare /> Send Message
                        {unreadMessages > 0 && (
                            <span style={{ 
                                position: 'absolute', 
                                top: '-6px', 
                                right: '-6px', 
                                background: 'var(--clr-mocha)', 
                                color: '#fff', 
                                fontSize: '0.65rem', 
                                minWidth: '18px', 
                                height: '18px', 
                                padding: '0 4px',
                                borderRadius: '10px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontWeight: 700, 
                                border: '2px solid #fff', 
                                boxShadow: '0 2px 4px rgba(0,0,0,0.15)' 
                            }}>
                                {unreadMessages}
                            </span>
                        )}
                    </button>

                    <div style={{ padding: '0.65rem 1.25rem', background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--clr-border)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        <FiShield size={14} /> EXECUTIVE ACCESS
                    </div>
                    
                    <button 
                        onClick={logout}
                        className="btn btn-ghost"
                        style={{ color: '#e57373', borderColor: 'rgba(211, 47, 47, 0.2)', padding: '0.65rem 1.25rem' }}
                    >
                        Logout
                    </button>
                    {/* Removed IssueAlert as requested */}
                </div>
            </div>

            {/* Domain Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {[
                    { id: 'academics', label: 'Academics', icon: <FiBook /> },
                    { id: 'transport', label: 'Transport', icon: <FiTruck /> },
                    { id: 'mess', label: 'Mess / Canteen', icon: <FiCoffee /> },
                    { id: 'hostel', label: 'Hostel', icon: <FiHome /> },
                    { id: 'sanitation', label: 'Sanitation', icon: <FiShield /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveDomain(tab.id)}
                        className={`btn ${activeDomain === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                    <div className="spinner" />
                </div>
            ) : activeDomain === 'academics' ? (
                <>
                    {/* Academics Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <StatCard icon={<FiMessageSquare />} label="Total Responses" value={summary?.totalFeedback || 0} color="var(--clr-primary)" bg="var(--clr-primary-lt)" />
                        <StatCard icon={<FiStar />} label="Overall Rating" value={`${summary?.avgRating || 0} / 5`} color="var(--clr-accent)" bg="var(--clr-accent-lt)" />
                        <StatCard icon={<FiTrendingUp />} label="Positive (4+★)" value={`${Math.round((summary?.positiveCount / summary?.totalFeedback) * 100) || 0}%`} color="var(--clr-success)" bg="var(--clr-success-lt)" />
                        <StatCard icon={<FiAlertTriangle />} label="Critical Concerns" value={summary?.lowRatingCount || 0} color="#dc2626" bg="#fef2f2" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div className="chart-card">
                            <h3>Department Performance</h3>
                            <div style={{ height: '280px' }}>
                                <Bar data={deptChartData} options={chartOptions} />
                            </div>
                        </div>
                        <div className="chart-card">
                            <h3>Top 5 Performing Faculties</h3>
                            <div style={{ height: '280px' }}>
                                <Bar 
                                    data={{
                                        labels: data?.faculty?.slice(0, 5).map(f => f.facultyName) || [],
                                        datasets: [{
                                            label: 'Avg Rating',
                                            data: data?.faculty?.slice(0, 5).map(f => f.avgRating),
                                            backgroundColor: '#1E4DB7', 
                                            borderRadius: 6
                                        }]
                                    }}
                                    options={chartOptions}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div className="card-premium">
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--clr-text)' }}>Semester Wise Trend</h3>
                            <div style={{ height: '280px' }}>
                                <Line data={trendData} options={chartOptions} />
                            </div>
                        </div>
                        <div className="card-premium">
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--clr-text)' }}>Participation</h3>
                            <div style={{ height: '280px' }}>
                                <Doughnut data={participationData} options={{ maintainAspectRatio: false, layout: { padding: 20 } }} />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Domain Specific Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div className="card-premium" style={{ gridColumn: '1 / -1', borderLeft: '6px solid var(--clr-primary)', padding: '2rem', background: 'var(--clr-bg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div className="icon-box" style={{ width: 72, height: 72, background: 'var(--clr-surface-2)', color: 'var(--clr-primary)', border: '1px solid var(--clr-border)' }}>
                                    <FiShield size={36} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Domain Leadership</p>
                                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--clr-text)', letterSpacing: '-0.01em', marginBottom: '0.5rem' }}>
                                        {DOMAIN_HEADS[activeDomain]?.name}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--clr-text-2)', fontSize: '0.9rem' }}>
                                            <FiUser size={14} /> <strong>{DOMAIN_HEADS[activeDomain]?.role}</strong>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--clr-text-3)', fontSize: '0.85rem' }}>
                                            <FiMail size={14} /> {DOMAIN_HEADS[activeDomain]?.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <StatCard icon={<FiMessageSquare />} label="Total Feedback" value={domainData?.totalFeedback || 0} color="var(--clr-primary)" bg="var(--clr-primary-lt)" />
                        <StatCard icon={<FiStar />} label="Avg Rating" value={`${domainData?.avgRating || 0} / 5`} color="var(--clr-accent)" bg="var(--clr-accent-lt)" />
                        <StatCard icon={<FiAlertTriangle />} label="Negative Feedback" value={domainData?.negativeFeedback || 0} color="#dc2626" bg="#fef2f2" />
                        <StatCard icon={<FiActivity />} label="Success Rate" value={`${Math.round(((domainData?.totalFeedback - domainData?.negativeFeedback) / domainData?.totalFeedback) * 100) || 0}%`} color="var(--clr-success)" bg="var(--clr-success-lt)" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div className="chart-card">
                            <h3>Question-wise Average</h3>
                            <div style={{ height: '260px' }}>
                                <Bar
                                    data={{
                                        labels: domainData?.questionStats?.map(q => q.question?.slice(0, 30) + '...') || [],
                                        datasets: [{ 
                                            label: 'Avg Rating', 
                                            data: domainData?.questionStats?.map(q => q.avgRating) || [], 
                                            backgroundColor: 'var(--clr-border)', // Oat
                                            borderRadius: 4 
                                        }]
                                    }}
                                    options={{ ...chartOptions, indexAxis: 'y' }}
                                />
                            </div>
                        </div>
                        <div className="chart-card">
                            <h3>Rating Trend</h3>
                            <div style={{ height: '260px' }}>
                                <Line data={trendData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            <MessageModal
                isOpen={showMessages}
                onClose={() => setShowMessages(false)}
                currentUserRole="principal"
                availableRoles={['admin', 'hod', 'domain_head', 'faculty']}
            />
        </AdminLayout>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="card-premium" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
        <div className="icon-box" style={{ background: `${color}15`, color: color, border: `1px solid ${color}30` }}>{icon}</div>
        <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--clr-text)' }}>{value}</div>
        </div>
    </div>
);

export default PrincipalDashboard;
