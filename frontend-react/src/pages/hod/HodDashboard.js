import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FiTrendingUp, FiCheckCircle, FiAlertCircle, FiMessageSquare } from 'react-icons/fi';
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

const HodDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMessages, setShowMessages] = useState(false);

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
            data: data?.trend?.map(t => t.avgRating) || [],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    // 2. Year Wise Trend
    const yearlyTrendData = {
        labels: data?.yearlyTrend?.map(t => t.year) || [],
        datasets: [{
            label: 'Avg Rating',
            data: data?.yearlyTrend?.map(t => t.avgRating) || [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    // 3. Subject Rating Comparison (Top 3)
    const subjectComparisonData = {
        labels: data?.subjectComparison?.map(s => s.name) || [],
        datasets: [{
            label: 'Avg Rating',
            data: data?.subjectComparison?.map(s => s.avgRating) || [],
            backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981'],
            borderRadius: 8
        }]
    };

    // 4. Top 5 Performing Faculties
    const topFacultyData = {
        labels: data?.topFaculty?.map(f => f._id) || [],
        datasets: [{
            label: 'Avg Rating',
            data: data?.topFaculty?.map(f => f.avgRating) || [],
            backgroundColor: '#8b5cf6',
            borderRadius: 8
        }]
    };

    const overallAvg = data?.trend?.length > 0 ? (data.trend.reduce((a, b) => a + (b.avgRating || 0), 0) / data.trend.length).toFixed(2) : '--';

    return (
        <AdminLayout title={`HOD Dashboard - ${user?.department?.name || 'Department'}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Welcome, {user?.name}</h1>
                    <p style={{ color: 'var(--clr-text-2)' }}>Performance insights for {user?.department?.name}</p>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card-premium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '12px', background: 'var(--clr-primary-lt)', borderRadius: '12px', color: 'var(--clr-primary)' }}>
                            <FiTrendingUp size={24} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--clr-text-2)', fontWeight: '600' }}>Average Department Rating</p>
                            <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>{overallAvg} / 5.0</h3>
                        </div>
                    </div>
                </div>
                <div className="card-premium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                            <FiCheckCircle size={24} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--clr-text-2)', fontWeight: '600' }}>Total Feedback Responses</p>
                            <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>
                                {data?.trend?.reduce((a, b) => a + b.total, 0) || 0}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card-premium">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Semester Wise Trend</h3>
                    <div style={{ height: '300px' }}>
                        <Line data={trendData} options={{ maintainAspectRatio: false, scales: { y: { min: 0, max: 5, beginAtZero: true } } }} />
                    </div>
                </div>
                <div className="card-premium">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Year Wise Trend</h3>
                    <div style={{ height: '300px' }}>
                        <Line data={yearlyTrendData} options={{ maintainAspectRatio: false, scales: { y: { min: 0, max: 5, beginAtZero: true } } }} />
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card-premium">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Subject Rating Comparison (Top 3)</h3>
                    <div style={{ height: '300px' }}>
                        <Bar data={subjectComparisonData} options={{ maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { min: 0, max: 5, beginAtZero: true } } }} />
                    </div>
                </div>
                <div className="card-premium">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Top 5 Performing Faculties</h3>
                    <div style={{ height: '300px' }}>
                        <Bar data={topFacultyData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 5, beginAtZero: true } } }} />
                    </div>
                </div>
            </div>

            {/* Lists */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1fr', gap: '1.5rem' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: 'span 2' }}>
                    <div className="card-premium">
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiCheckCircle color="#10b981" /> High Performing Subjects
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {data?.highestRatedSubjects?.slice(0, 5).map(s => (
                                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{s.name}</div>
                                    <span className="badge badge-success">{s.avgRating?.toFixed(2) || '0.00'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="card-premium">
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiAlertCircle color="#ef4444" /> Areas of Improvement
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {data?.lowestRatedSubjects?.slice(0, 5).map(s => (
                                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{s.name}</div>
                                    <span className="badge badge-danger">{s.avgRating?.toFixed(2) || '0.00'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <MessageModal 
                isOpen={showMessages} 
                onClose={() => setShowMessages(false)} 
                currentUserRole="hod"
                availableRoles={['faculty']}
            />
        </AdminLayout>
    );
};

export default HodDashboard;
