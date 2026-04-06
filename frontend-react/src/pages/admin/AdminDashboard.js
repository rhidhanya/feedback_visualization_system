import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import { FiMessageSquare, FiStar, FiLayers, FiBook, FiInbox, FiShield, FiDownload, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { generateDashboardPDF } from '../../utils/pdfReportGenerator';
import './AdminDashboard.css';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ── Chart defaults ─────────────────────────────────────────────────────────
const OAT = '#F8FAFC';
const TAUPE = '#1E4DB7'; // Institutional Blue

const TEXT = '#0F172A'; // Black text
const GRID = 'rgba(0,0,0,0.05)'; // Subtle lines
const TIP = {
    backgroundColor: '#FFFFFF',
    titleColor: '#0F172A',
    bodyColor: '#475569',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8,
};
const TICK = { color: '#64748B', font: { family: 'Inter', size: 11, weight: 600 } };
const baseChartOpts = (extraOpts = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 10 },
    plugins: {
        legend: { labels: { color: TEXT, font: { family: 'Inter', size: 12, weight: 600 }, padding: 16 } },
        tooltip: { ...TIP },
        ...extraOpts.plugins,
    },
    scales: {
        x: { grid: { color: GRID }, ticks: TICK },
        y: { grid: { color: GRID }, ticks: TICK },
    },
    ...extraOpts,
});

// Palette – clean Blue & Slate compatible variations
const CHART_COLORS = ['#1E4DB7', '#3B82F6', '#60A5FA', '#94A3B8'];



const AdminDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sanitize dept: handle populated department object vs ID string
    const userDeptId = user?.department?._id || user?.department || '';
    const [dept, setDept] = useState(user?.role === 'hod' ? userDeptId : '');
    const [deptList, setDeptList] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const socketRef = useRef(null);
    const facultyChartRef = useRef(null);
    const trendChartRef = useRef(null);

    const [settings, setSettings] = useState({ isFeedbackOpen: false, feedbackStartDate: '', feedbackDeadline: '' });
    const [updatingSettings, setUpdatingSettings] = useState(false);

    useEffect(() => {
        api.get('/departments').then(r => setDeptList(r.data.data || [])).catch(() => { });
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data.data) {
                const s = res.data.data;
                setSettings({
                    isFeedbackOpen: s.isFeedbackOpen,
                    feedbackStartDate: s.feedbackStartDate ? new Date(s.feedbackStartDate).toISOString().slice(0, 16) : '',
                    feedbackDeadline: s.feedbackDeadline ? new Date(s.feedbackDeadline).toISOString().slice(0, 16) : ''
                });
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setUpdatingSettings(true);
        try {
            await api.put('/settings', {
                isFeedbackOpen: settings.isFeedbackOpen,
                feedbackStartDate: settings.feedbackStartDate || null,
                feedbackDeadline: settings.feedbackDeadline || null
            });
            setToast({ type: 'success', msg: 'Feedback settings updated successfully' });
        } catch (err) {
            setToast({ type: 'error', msg: 'Failed to update feedback settings' });
        } finally {
            setUpdatingSettings(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    const buildParams = useCallback(() => {
        const p = {};
        if (dept) p.department = dept;
        return p;
    }, [dept]);

    const fetchAll = useCallback(async () => {
        if (!user) return; // Wait for auth to settle
        setLoading(true);
        try {
            const params = buildParams();
            const [sum, fac, dist, trend, deptData] = await Promise.all([
                api.get('/analytics/summary', { params }).catch(e => { console.error('Summary fetch error:', e); return { data: { data: null } }; }),
                api.get('/analytics/by-faculty', { params }).catch(e => { console.error('Faculty fetch error:', e); return { data: { data: [] } }; }),
                api.get('/analytics/distribution', { params }).catch(e => { console.error('Dist fetch error:', e); return { data: { data: [] } }; }),
                api.get('/analytics/trend', { params }).catch(e => { console.error('Trend fetch error:', e); return { data: { data: [] } }; }),
                api.get('/analytics/by-department').catch(e => { console.error('Dept analytics fetch error:', e); return { data: { data: [] } }; }),
            ]);
            setData({
                summary: sum.data.data,
                faculty: fac.data.data || [],
                dist: dist.data.data || [],
                trend: trend.data.data || [],
                deptData: deptData.data.data || [],
            });
            setLastUpdate(new Date());
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [buildParams, user]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleGeneratePDF = useCallback(async () => {
        setPdfLoading(true);
        try {
            await generateDashboardPDF(data, dept, { facultyChartRef, trendChartRef });
            setToast({ type: 'success', msg: 'PDF report downloaded successfully' });
        } catch (err) {
            console.error('PDF generation error:', err);
            setToast({ type: 'error', msg: 'PDF failed: ' + (err.message || 'try again') });
        } finally {
            setPdfLoading(false);
            setTimeout(() => setToast(null), 4000);
        }
    }, [dept, data, facultyChartRef, trendChartRef]);

    useEffect(() => {
        const socket = io(API_CONFIG.SOCKET_URL, {
            transports: ['websocket'],
        });
        socketRef.current = socket;
        socket.on('feedbackUpdated', fetchAll);
        return () => socket.disconnect();
    }, [fetchAll]);

    // ── Faculty bar chart ────────────────────────────────────────────
    const facultyChart = React.useMemo(() => data ? {
        labels: data.faculty.slice(0, 15).map(f => f.facultyName?.split(' ').slice(0, 2).join(' ') || '—'),
        datasets: [{
            label: 'Avg Rating',
            data: data.faculty.slice(0, 15).map(f => f.avgRating),
            backgroundColor: TAUPE,
            borderRadius: 8,
            barThickness: 18
        }],
    } : null, [data]);

    // ── Rating distribution pie ──────────────────────────────────────
    const pieDist = React.useMemo(() => data?.dist ? {
        labels: Object.keys(data.dist).map(d => `${d} ★`),
        datasets: [{
            data: Object.values(data.dist),
            backgroundColor: CHART_COLORS,
            borderColor: '#fff',
            borderWidth: 2,
        }],
    } : null, [data]);

    // ── Semester trend line ──────────────────────────────────────────
    const trendChart = React.useMemo(() => data?.trend?.length ? {
        labels: data.trend.map(t => t.label || `Sem ${t.semester}`),
        datasets: [{
            label: 'Avg Rating',
            data: data.trend.map(t => t.avgRating || 0),
            borderColor: TAUPE,
            backgroundColor: 'rgba(163, 147, 130, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: OAT,
            pointRadius: 5,
            pointHoverRadius: 7
        }],
    } : null, [data]);

    // ── Department comparison bar ────────────────────────────────────
    const deptChart = React.useMemo(() => data?.deptData?.length ? {
        labels: data.deptData.map(d => d.deptCode),
        datasets: [{
            label: 'Avg Rating',
            data: data.deptData.map(d => d.avgRating),
            backgroundColor: data.deptData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
            borderRadius: 8,
            barThickness: 25
        }],
    } : null, [data]);

    if (loading) {
        return (
            <AdminLayout title="Dashboard">
                <div className="loading-state"><div className="spinner" /><span>Loading analytics…</span></div>
            </AdminLayout>
        );
    }

    const { summary } = data || {};
    const fmt = (v) => v != null ? (Math.round(v * 100) / 100).toLocaleString() : '—';

    return (
        <AdminLayout title="Dashboard">
            {/* ── Page Header ─────────────────────────────── */}
            <div className="dash-header" style={{ marginBottom: '1.25rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--clr-text)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                        Faculty Feedback <span style={{ color: 'var(--clr-primary)' }}>Analytics</span>
                    </h2>
                    <p style={{ color: 'var(--clr-text-3)', fontSize: '0.875rem' }}>Real-time institutional performance metrics</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {lastUpdate && (
                        <div className="live-badge">
                            <span className="live-dot" />
                            Live · {lastUpdate.toLocaleTimeString()}
                        </div>
                    )}
                    <button
                        id="generate-pdf-btn"
                        className="btn btn-primary"
                        onClick={handleGeneratePDF}
                        disabled={pdfLoading}
                        style={{ fontSize: '0.815rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <FiDownload size={14} />
                        {pdfLoading ? 'Generating…' : 'Generate PDF Report'}
                    </button>
                </div>
            </div>

            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    background: toast.type === 'success' ? '#088F8F' : '#dc2626',
                    color: '#fff', padding: '12px 20px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {toast.type === 'success' ? <FiCheck size={18} /> : <FiAlertTriangle size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Dept Filter ─────────────────────────────── */}
            <div className="card-premium" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FiLayers style={{ color: 'var(--clr-primary)' }} size={20} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter Department</span>
                </div>
                <select
                    className="fa-select"
                    style={{ background: 'transparent', border: '1px solid var(--clr-border)', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.9rem', color: 'var(--clr-text)', minWidth: '200px' }}
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                >
                    <option value="">All Departments</option>
                    {deptList.map(d => (
                        <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '1rem', marginBottom: '1.25rem' }}>
                {/* ── Feedback Period Settings ───────── */}
                <div className="system-settings-panel">
                    <div>
                        <h3><FiAlertTriangle size={16} /> Feedback Period Settings</h3>
                        <p>Control when students are allowed to submit or edit their feedback.</p>
                    </div>

                    <form onSubmit={handleUpdateSettings} style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ margin: 0, minWidth: '150px' }}>
                            <label>Status</label>
                            <select
                                value={settings.isFeedbackOpen.toString()}
                                onChange={(e) => setSettings({ ...settings, isFeedbackOpen: e.target.value === 'true' })}
                            >
                                <option value="true">Open</option>
                                <option value="false">Closed</option>
                            </select>
                        </div>

                        <div className="input-group" style={{ margin: 0, minWidth: '200px' }}>
                            <label>Start Date</label>
                            <input
                                type="datetime-local"
                                value={settings.feedbackStartDate}
                                onChange={(e) => setSettings({ ...settings, feedbackStartDate: e.target.value })}
                            />
                        </div>

                        <div className="input-group" style={{ margin: 0, minWidth: '200px' }}>
                            <label>End Date</label>
                            <input
                                type="datetime-local"
                                value={settings.feedbackDeadline}
                                onChange={(e) => setSettings({ ...settings, feedbackDeadline: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={updatingSettings}
                            style={{ height: '42px', padding: '0 1.5rem' }}
                        >
                            {updatingSettings ? 'Saving...' : 'Save Settings'}
                        </button>
                    </form>
                </div>

                {/* ── System Status ──────────────────── */}
                <div className="card-premium" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#69db7c' }} /> System Status
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#40c057' }} />
                            All systems operational
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--clr-hover-bg)' }} />
                            Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Loading...'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KPI Cards ───────────────────────────────── */}
            <div className="kpi-grid" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <KpiCard
                    icon={<FiMessageSquare size={20} />}
                    label="Total Feedback" value={summary?.totalFeedback ?? 0}
                    sub="Aggregated submissions" color="var(--clr-primary)"
                />
                <KpiCard
                    icon={<FiStar size={20} />}
                    label="Avg Rating"
                    value={`${fmt(summary?.avgOverallRating)} / 5`}
                    sub="Institutional average" color="var(--clr-primary)"
                />
                <KpiCard
                    icon={<FiLayers size={20} />}
                    label="Active Depts"
                    value={`${summary?.activeDepartments ?? 0} / ${deptList.length || 8}`}
                    sub="Current participation" color="var(--clr-primary)"
                />
                <KpiCard
                    icon={<FiBook size={20} />}
                    label="Subjects"
                    value={summary?.subjectsRated ?? 0}
                    sub="Unique rated courses" color="var(--clr-primary)"
                />
            </div>

            {/* ── Row 1: Faculty Bar + Rating Pie ─────────── */}
            <div className="charts-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3>Faculty Rating Comparison</h3>
                    </div>
                    <div style={{ height: 240 }}>
                        {facultyChart ? (
                            <Bar ref={facultyChartRef} data={facultyChart} options={baseChartOpts({
                                indexAxis: 'y',
                                scales: {
                                    x: { min: 0, max: 5, ticks: TICK, grid: { color: GRID } },
                                    y: { ticks: { ...TICK, font: { size: 11 } }, grid: { display: false } },
                                },
                            })} />
                        ) : <NoData />}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3>Rating Distribution</h3>
                    </div>
                    <div style={{ height: 240 }}>
                        {pieDist ? (
                            <Pie data={pieDist} options={baseChartOpts({
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: TEXT, font: { family: 'Inter', size: 12 }, padding: 12 },
                                    },
                                    tooltip: TIP,
                                },
                            })} />
                        ) : <NoData />}
                    </div>
                </div>
            </div>

            {/* ── Row 2: Semester Trend + Dept Comparison ── */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3>Semester Rating Trend</h3>
                    </div>
                    <div style={{ height: 220 }}>
                        {trendChart ? (
                            <Line ref={trendChartRef} data={trendChart} options={baseChartOpts({
                                scales: {
                                    x: { ticks: TICK, grid: { display: false } },
                                    y: { min: 0, max: 5, ticks: TICK, grid: { color: GRID } },
                                },
                            })} />
                        ) : <NoData />}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3>Department Comparison</h3>
                    </div>
                    <div style={{ height: 220 }}>
                        {deptChart ? (
                            <Bar data={deptChart} options={baseChartOpts({
                                plugins: { legend: { display: false }, tooltip: TIP },
                                scales: {
                                    x: { ticks: TICK, grid: { display: false } },
                                    y: { min: 0, max: 5, ticks: TICK, grid: { color: GRID } },
                                },
                            })} />
                        ) : <NoData />}
                    </div>
                </div>
            </div>

            {/* ── Anonymous notice ────────────────────────── */}
            <div className="anon-notice">
                <FiShield size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                All analytics are based on aggregated, anonymous feedback. No student identity is revealed in any report.
            </div>
        </AdminLayout>
    );
};

// ── Small reusable components ──────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, color }) => (
    <div className="card-premium" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
        <div className="icon-box" style={{ background: `${color}15`, color: color, border: `1px solid ${color}30` }}>
            {icon}
        </div>
        <div>
            <div className="kpi-label" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>{label}</div>
            <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--clr-text)' }}>{value}</div>
            <div className="kpi-sub" style={{ fontSize: '0.75rem', color: 'var(--clr-text-2)', marginTop: '0.1rem' }}>{sub}</div>
        </div>
    </div>
);

const NoData = () => (
    <div className="empty-state" style={{ padding: '3rem 1rem' }}>
        <div className="icon-box" style={{ background: 'var(--clr-bg)', color: 'var(--clr-text)', marginBottom: '1.25rem', width: '60px', height: '60px', border: '1px solid var(--clr-border)' }}>
            <FiInbox size={24} />
        </div>
        <span style={{ fontWeight: 800, color: 'var(--clr-text)', textTransform: 'uppercase', fontSize: '0.85rem' }}>No analytics available</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)', marginTop: '0.5rem' }}>Check back later once more feedback is collected</span>
    </div>
);

export default AdminDashboard;
