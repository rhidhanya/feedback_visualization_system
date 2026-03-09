import React, { useState, useEffect } from 'react';
import {
    FiBook, FiStar, FiMessageSquare, FiTrendingUp, FiActivity,
    FiInbox, FiLogOut
} from 'react-icons/fi';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import { CampusLensLogo } from '../../components/CollegePulseLogo';
import '../admin/AdminDashboard.css'; // inherit styling

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const TEXT = '#475569';
const GRID = '#e2e8f0';
const TIP = {
    backgroundColor: '#fff',
    titleColor: '#0f172a',
    bodyColor: '#475569',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 12,
};
const TICK = { color: TEXT, font: { family: 'Inter', size: 11 } };
const baseChartOpts = (extraOpts = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: TEXT, font: { family: 'Inter', size: 12 }, padding: 16 } },
        tooltip: { ...TIP },
        ...extraOpts.plugins,
    },
    ...extraOpts,
});

const FacultyDashboard = () => {
    const { user, logout } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMessages, setShowMessages] = useState(false);

    useEffect(() => {
        const fetchFacultyData = async () => {
            try {
                const res = await api.get('/analytics/faculty-detail');
                if (res.data.success) {
                    setData(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch faculty data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFacultyData();
    }, []);

    if (loading) return (
        <div style={{ padding: '2rem' }}>
             <div className="loading-state"><div className="spinner" /><span>Loading dashboard...</span></div>
        </div>
    );

    const trendData = {
        labels: data?.trend?.length > 0 ? data.trend.map(t => t.label || `Sem ${t.semester}`) : ['No Data'],
        datasets: [{
            label: 'Avg Rating',
            data: data?.trend?.length > 0 ? data.trend.map(t => t.avgRating) : [0],
            borderColor: '#088F8F',
            backgroundColor: 'rgba(8,143,143,0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#088F8F',
            pointRadius: 5,
        }]
    };

    const subjectData = {
        labels: data?.bySubject?.map(s => s.subjectCode || s.name) || [],
        datasets: [{
            label: 'Response Count',
            data: data?.bySubject?.map(s => s.count) || [],
            backgroundColor: '#0047AB',
            borderRadius: 5,
        }]
    };

    return (
        <div className="admin-layout" style={{ background: 'var(--clr-bg)' }}>
            <div className="main-content" style={{ marginLeft: 0, width: '100%' }}>
                {/* ── Header ── */}
                <header className="topbar">
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                         <CampusLensLogo iconSize={30} />
                         <span className="topbar-title">Faculty Portal</span>
                    </div>
                    <div className="topbar-right" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                         <button 
                             onClick={() => setShowMessages(true)}
                             className="btn btn-primary"
                             style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                         >
                             <FiMessageSquare /> Send Message
                         </button>
                         <div className="user-chip">
                              <div className="user-avatar">{user?.name?.charAt(0) || 'F'}</div>
                              <span>Prof. {user?.name}</span>
                         </div>
                         <button onClick={logout} className="btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: 'var(--clr-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <FiLogOut size={16} /> Logout
                         </button>
                    </div>
                </header>

                <main className="page-content" style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '2rem' }}>
                    
                    <div className="dash-header">
                        <div>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.15rem' }}>Your Academic Performance</h2>
                            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                Interactive overview of your semester feedback and engagement metrics.
                            </p>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                        <KpiCard icon={<FiStar size={18} />} label="Overall Rating" value={`${data?.overall?.avgRating || 0} / 5`} sub="Aggregate score" color="#088F8F" />
                        <KpiCard icon={<FiInbox size={18} />} label="Total Responses" value={data?.overall?.totalFeedback || 0} sub="All-time feedback" color="#0047AB" />
                        <KpiCard icon={<FiBook size={18} />} label="Subjects Taught" value={data?.subjectsTaught?.length || 0} sub="Assigned records" color="#6F8FAF" />
                        <KpiCard icon={<FiActivity size={18} />} label="Trend Momentum" value={data?.trend?.length > 1 ? (data.trend[data.trend.length - 1].avgRating >= data.trend[data.trend.length - 2].avgRating ? 'Upward' : 'Downward') : 'Stable'} sub="Based on recent sem" color="#A7C7E7" />
                    </div>

                    {/* Charts Row */}
                    <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <h3><FiTrendingUp style={{ marginRight: '6px' }} color="var(--clr-accent)" /> Rating Trend</h3>
                            </div>
                            <div style={{ height: 260 }}>
                                <Line data={trendData} options={baseChartOpts({
                                    scales: {
                                        x: { ticks: TICK, grid: { display: false } },
                                        y: { min: 0, max: 5, ticks: TICK, grid: { color: GRID }, beginAtZero: true },
                                    },
                                })} />
                            </div>
                        </div>
                        
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <h3><FiActivity style={{ marginRight: '6px' }} color="#6366f1" /> Engagement per Subject</h3>
                            </div>
                            <div style={{ height: 260 }}>
                                <Bar data={subjectData} options={baseChartOpts({
                                    plugins: { legend: { display: false }, tooltip: TIP },
                                    scales: {
                                        x: { ticks: TICK, grid: { display: false } },
                                        y: { beginAtZero: true, ticks: { ...TICK, font: { size: 11 } }, grid: { color: GRID } },
                                    },
                                })} />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Feedback & Messages */}
                    <div className="charts-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)', alignItems: 'start' }}>
                        
                        <div className="chart-card" style={{ height: 'fit-content' }}>
                            <div className="chart-card-header">
                                <h3><FiMessageSquare style={{ marginRight: '6px' }} color="var(--clr-primary)" /> Anonymous Student Suggestions</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {data?.anonymousComments?.length > 0 ? (
                                    data.anonymousComments.map((comment, i) => (
                                        <div key={i} style={{ padding: '1rem', borderRadius: '12px', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--clr-primary)', textTransform: 'uppercase' }}>{comment.subject}</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: comment.rating >= 4 ? 'var(--clr-success)' : (comment.rating <= 2 ? 'var(--clr-danger)' : 'var(--clr-primary)') }}>
                                                    ★ {comment.rating}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.92rem', color: '#334155', lineHeight: '1.5', fontStyle: 'italic' }}>"{comment.comment}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <FiInbox size={28} style={{ color: '#A7C7E7', marginBottom: '0.5rem' }} />
                                        <span>No suggestions submitted yet</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <MessageModal 
                        isOpen={showMessages} 
                        onClose={() => setShowMessages(false)} 
                        currentUserRole="faculty"
                        availableRoles={['hod', 'principal']}
                    />
                </main>
            </div>
        </div>
    );
};

const KpiCard = ({ icon, label, value, sub, color }) => (
    <div className="kpi-card" style={{ '--kpi-color': color }}>
        <div className="kpi-icon" style={{ background: `${color}18`, color }}>
            {icon}
        </div>
        <div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value" style={{ color }}>{value}</div>
            <div className="kpi-sub">{sub}</div>
        </div>
    </div>
);

export default FacultyDashboard;
