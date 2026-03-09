import React, { useState, useEffect, useCallback } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { FiTrendingUp, FiMessageSquare, FiStar, FiAlertTriangle, FiActivity, FiBook, FiTruck, FiCoffee, FiHome, FiShield } from 'react-icons/fi';
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
import IssueAlert from '../../components/IssueAlert';
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

const PrincipalDashboard = () => {
    const { user } = useAuth();
    const [activeDomain, setActiveDomain] = useState('academics'); // academics, transport, mess, hostel, sanitation
    const [data, setData] = useState(null);
    const [domainData, setDomainData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMessages, setShowMessages] = useState(false);

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
            backgroundColor: data.byDepartment.map((_, i) => ['#5d3a6f', '#725483', '#897098', '#aa98b5', '#cbc1d2'][i % 5]),
            borderRadius: 8,
        }]
    } : { labels: [], datasets: [] };

    const participationData = {
        labels: ['Responded', 'Not Responded'],
        datasets: [{
            data: [data?.summary?.totalFeedback || 0, (data?.summary?.totalStudents || 0) - (data?.summary?.totalFeedback || 0)],
            backgroundColor: ['var(--clr-primary)', '#e2e8f0'],
            hoverOffset: 4
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#475569', font: { family: 'Inter', size: 12 } } },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#0f172a',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 12,
            }
        },
        scales: {
            y: {
                min: 0,
                max: 5,
                ticks: { color: '#475569', font: { family: 'Inter', size: 11 } },
                grid: { color: '#e2e8f0' }
            },
            x: {
                ticks: { color: '#475569', font: { family: 'Inter', size: 11 } },
                grid: { display: false }
            }
        }
    };

    const summary = data?.summary || {};

    const trendData = activeDomain === 'academics' ? {
        labels: data?.trend?.map((t, i) => t.label || `Sem ${t.semester}`) || [],
        datasets: [{
            label: 'Avg Rating Trend',
            data: data?.trend?.map(t => t.avgRating || 0) || [],
            borderColor: '#5d3a6f',
            backgroundColor: 'rgba(93, 58, 111, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#5d3a6f',
        }]
    } : {
        labels: domainData?.semesterTrend?.map(t => `Sem ${t.semester}`) || [],
        datasets: [{
            label: 'Avg Rating',
            data: domainData?.semesterTrend?.map(t => t.avgRating) || [],
            borderColor: 'var(--clr-accent)',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    return (
        <AdminLayout title="Principal Dashboard" noSidebar={true}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                        Welcome, Dr. {user.name.split(' ')[0]}
                    </h1>
                    <p style={{ color: '#64748b' }}>Institutional Head</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowMessages(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#cbd5e1'}
                        onMouseLeave={e => e.currentTarget.style.background = '#e2e8f0'}
                    >
                        <FiMessageSquare /> Send Message
                    </button>

                    <div style={{ padding: '0.5rem 1rem', background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--clr-primary-lt)' }}>
                        <FiShield /> EXECUTIVE ACCESS
                    </div>
                    <IssueAlert role="principal" />
                </div>
            </div>

            {/* Domain Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
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
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1.25rem', borderRadius: '12px', border: 'none',
                            background: activeDomain === tab.id ? 'var(--clr-primary)' : '#fff',
                            color: activeDomain === tab.id ? '#fff' : '#64748b',
                            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: activeDomain === tab.id ? '0 10px 15px -3px rgba(93, 58, 111, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                            whiteSpace: 'nowrap'
                        }}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <StatCard icon={<FiMessageSquare />} label="Total Responses" value={summary?.totalFeedback || 0} color="var(--clr-primary)" bg="var(--clr-primary-lt)" />
                        <StatCard icon={<FiStar />} label="Overall Rating" value={`${summary?.avgRating || 0} / 5`} color="var(--clr-accent)" bg="var(--clr-accent-lt)" />
                        <StatCard icon={<FiTrendingUp />} label="Positive (4+★)" value={`${Math.round((summary?.positiveCount / summary?.totalFeedback) * 100) || 0}%`} color="var(--clr-success)" bg="var(--clr-success-lt)" />
                        <StatCard icon={<FiAlertTriangle />} label="Critical Concerns" value={summary?.lowRatingCount || 0} color="#dc2626" bg="#fef2f2" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="card-premium" style={{ background: '#fff', padding: '1.75rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Department Performance</h3>
                            <div style={{ height: '300px' }}>
                                <Bar data={deptChartData} options={chartOptions} />
                            </div>
                        </div>
                        <div className="card-premium" style={{ background: '#fff', padding: '1.75rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Top 5 Performing Faculties</h3>
                            <div style={{ height: '300px' }}>
                                <Bar 
                                    data={{
                                        labels: data?.faculty?.slice(0, 5).map(f => f.facultyName) || [],
                                        datasets: [{
                                            label: 'Avg Rating',
                                            data: data?.faculty?.slice(0, 5).map(f => f.avgRating),
                                            backgroundColor: '#5d3a6f',
                                            borderRadius: 8
                                        }]
                                    }}
                                    options={chartOptions}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="card-premium" style={{ background: '#fff', padding: '1.75rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Semester Wise Trend</h3>
                            <div style={{ height: '300px' }}>
                                <Line data={trendData} options={chartOptions} />
                            </div>
                        </div>
                        <div className="card-premium" style={{ background: '#fff', padding: '1.75rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Participation</h3>
                            <div style={{ height: '300px' }}>
                                <Doughnut data={participationData} options={{ maintainAspectRatio: false }} />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Domain Specific Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <StatCard icon={<FiMessageSquare />} label="Total Feedback" value={domainData?.totalFeedback || 0} color="var(--clr-primary)" bg="var(--clr-primary-lt)" />
                        <StatCard icon={<FiStar />} label="Avg Rating" value={`${domainData?.avgRating || 0} / 5`} color="var(--clr-accent)" bg="var(--clr-accent-lt)" />
                        <StatCard icon={<FiAlertTriangle />} label="Negative Feedback" value={domainData?.negativeFeedback || 0} color="#dc2626" bg="#fef2f2" />
                        <StatCard icon={<FiActivity />} label="Success Rate" value={`${Math.round(((domainData?.totalFeedback - domainData?.negativeFeedback) / domainData?.totalFeedback) * 100) || 0}%`} color="var(--clr-success)" bg="var(--clr-success-lt)" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="card-premium" style={{ background: '#fff', padding: '1.75rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Question-wise Average</h3>
                            <div style={{ height: '350px' }}>
                                <Bar
                                    data={{
                                        labels: domainData?.questionStats?.map(q => q.question?.slice(0, 30) + '...') || [],
                                        datasets: [{ label: 'Avg Rating', data: domainData?.questionStats?.map(q => q.avgRating) || [], backgroundColor: 'var(--clr-primary)', borderRadius: 4 }]
                                    }}
                                    options={{ maintainAspectRatio: false, indexAxis: 'y', scales: { x: { min: 0, max: 5 } } }}
                                />
                            </div>
                        </div>
                        <div className="card-premium" style={{ background: '#fff', padding: '1.75rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Rating Trend</h3>
                            <div style={{ height: '350px' }}>
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

const StatCard = ({ icon, label, value, color, bg }) => (
    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ background: bg, color: color, padding: '1rem', borderRadius: '16px' }}>{icon}</div>
        <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>{label}</p>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{value}</h2>
        </div>
    </div>
);

export default PrincipalDashboard;
