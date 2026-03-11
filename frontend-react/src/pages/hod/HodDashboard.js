import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FiTrendingUp, FiCheckCircle, FiAlertCircle, FiMessageSquare, FiInbox } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import MessageModal from '../../components/MessageModal';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

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
        padding: { left: 10, right: 10, top: 10, bottom: 10 }
    }
};

const HodDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMessages, setShowMessages] = useState(false);
    const [viewMode, setViewMode] = useState('overview'); // 'overview', 'high_performing', 'areas_improvement'

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/analytics/hod-stats');
                if (res.data.success) {
                    setData(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch HOD stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user]);

    if (loading) return <AdminLayout title="HOD Dashboard"><div style={{ padding: '2rem' }}>Loading Dashboard...</div></AdminLayout>;

    // 1. Semester Wise Trend
    const trendData = {
        labels: data?.trend?.map(t => `Semester ${t.semester}`) || [],
        datasets: [{
            label: 'Avg Rating',
            data: data?.trend?.map(t => t.avgRating || 0) || [],
            borderColor: '#1E4DB7', // Standard Blue
            backgroundColor: 'rgba(30, 77, 183, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: '#232323'
        }]
    };

    // 2. Year Wise Trend
    const yearlyTrendData = {
        labels: data?.yearlyTrend?.map(t => t.year) || [],
        datasets: [{
            label: 'Avg Rating',
            data: data?.yearlyTrend?.map(t => t.avgRating || 0) || [],
            borderColor: '#1E4DB7', // Standard Blue
            backgroundColor: 'rgba(30, 77, 183, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: '#232323'
        }]
    };

    // 3. Subject Rating Comparison (Top 3)
    const subjectComparisonData = {
        labels: data?.subjectComparison?.map(s => s.name) || [],
        datasets: [{
            label: 'Avg Rating',
            data: data?.subjectComparison?.map(s => s.avgRating || 0) || [],
            backgroundColor: ['#1E4DB7', '#3B82F6', '#60A5FA'],
            borderRadius: 4,
            barThickness: 18
        }]
    };

    // 4. Top 5 Performing Faculties
    const topFacultyData = {
        labels: data?.topFaculty?.map(f => f._id) || [],
        datasets: [{
            label: 'Avg Rating',
            data: data?.topFaculty?.map(f => f.avgRating || 0) || [],
            backgroundColor: '#1E4DB7', // Standard Blue
            borderRadius: 8,
            barThickness: 20
        }]
    };

    const overallAvg = data?.trend?.length > 0 ? (data.trend.reduce((a, b) => a + (b.avgRating || 0), 0) / data.trend.length).toFixed(2) : '--';

    return (
        <AdminLayout title={`HOD Dashboard - ${user?.department?.name || 'Department'}`}>
            <div className="dash-header">
                <div>
                    <h2>Welcome, {user?.name}</h2>
                    <p>Performance insights for {user?.department?.name}</p>
                </div>
                
                <button 
                    onClick={() => setShowMessages(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <FiMessageSquare /> Send Message
                </button>
            </div>

            {/* Department KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card-premium" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
                    <div className="icon-box" style={{ background: 'rgba(163, 147, 130, 0.1)', color: 'var(--clr-text-2)', border: '1px solid var(--clr-border)' }}>
                        <FiTrendingUp size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Avg Department Rating</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--clr-text)' }}>{overallAvg} / 5.0</div>
                    </div>
                </div>
                <div className="card-premium" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
                    <div className="icon-box" style={{ background: 'rgba(104, 93, 84, 0.15)', color: 'var(--clr-text-2)', border: '1px solid var(--clr-border)' }}>
                        <FiCheckCircle size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Total Responses</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--clr-text)' }}>
                            {data?.trend?.reduce((a, b) => a + b.total, 0) || 0}
                        </div>
                    </div>
                </div>
            </div>

            {/* View Selection Tab */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                    { id: 'overview', label: 'Domain Overview', icon: null },
                    { id: 'high_performing', label: 'High Performing Subjects', icon: <FiCheckCircle /> },
                    { id: 'areas_improvement', label: 'Areas of Improvement', icon: <FiAlertCircle /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id)}
                        className={`btn ${viewMode === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {viewMode === 'overview' ? (
                <>
                    {/* Charts Row 1 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="chart-card">
                            <h3>Semester Wise Trend</h3>
                            <div style={{ height: '300px' }}>
                                {data?.trend?.length > 0 ? (
                                    <Line data={trendData} options={chartOptions} />
                                ) : <NoData />}
                            </div>
                        </div>
                        <div className="chart-card">
                            <h3>Year Wise Trend</h3>
                            <div style={{ height: '300px' }}>
                                {data?.yearlyTrend?.length > 0 ? (
                                    <Line data={yearlyTrendData} options={chartOptions} />
                                ) : <NoData />}
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="chart-card">
                            <h3>Subject Rating Comparison (Top 3)</h3>
                            <div style={{ height: '300px' }}>
                                {data?.subjectComparison?.length > 0 ? (
                                    <Bar data={subjectComparisonData} options={{ ...chartOptions, indexAxis: 'y', plugins: { ...chartOptions.plugins, legend: { display: false } }, scales: { ...chartOptions.scales, x: { ...chartOptions.scales.y, grid: { color: 'var(--clr-chart-grid)' } }, y: { ...chartOptions.scales.x, grid: { display: false } } } }} />
                                ) : <NoData />}
                            </div>
                        </div>
                        <div className="chart-card">
                            <h3>Top 5 Performing Faculties</h3>
                            <div style={{ height: '300px' }}>
                                {data?.topFaculty?.length > 0 ? (
                                    <Bar data={topFacultyData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
                                ) : <NoData />}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {viewMode === 'high_performing' ? (
                        data?.highestRatedSubjects?.length > 0 ? (
                            data.highestRatedSubjects.map(s => <SubjectCard key={s._id} subject={s} type="high" />)
                        ) : <NoData />
                    ) : (
                        data?.lowestRatedSubjects?.length > 0 ? (
                            data.lowestRatedSubjects.map(s => <SubjectCard key={s._id} subject={s} type="low" />)
                        ) : <NoData />
                    )}
                </div>
            )}

            <MessageModal 
                isOpen={showMessages} 
                onClose={() => setShowMessages(false)} 
                currentUserRole="hod"
                availableRoles={['faculty']}
            />
        </AdminLayout>
    );
};

const SubjectCard = ({ subject, type }) => (
    <div className="card-premium" style={{ borderLeft: `4px solid ${type === 'high' ? 'var(--clr-primary)' : 'var(--clr-text-3)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--clr-text)' }}>{subject.name}</h4>
            <span className={`badge ${type === 'high' ? 'badge-primary' : 'badge-danger'}`} style={{ padding: '0.4rem 0.75rem' }}>
                {subject.avgRating?.toFixed(2)}
            </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--clr-text-2)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--clr-text-3)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Faculty</span> {subject.facultyName || 'TBA'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--clr-text-2)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--clr-text-3)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Semester</span> {subject.semester}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--clr-text-3)', fontSize: '0.75rem', marginTop: '4px' }}>
                <span>Code: {subject.code}</span>
            </div>
        </div>
    </div>
);

const NoData = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-3)', padding: '2rem' }}>
        <FiInbox size={32} style={{ marginBottom: '0.75rem', color: 'var(--clr-border)' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>No Data Found</span>
    </div>
);

export default HodDashboard;
