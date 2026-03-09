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
import { generateDashboardPDF } from '../../utils/pdfReportGenerator';
import './AdminDashboard.css';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ── Chart defaults ─────────────────────────────────────────────────────────
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

// Palette – only the allowed shades
const CHART_COLORS = ['#0047AB', '#6F8FAF', '#A7C7E7', '#088F8F'];

// Dept filter options
// eslint-disable-next-line no-unused-vars
const DEPT_OPTIONS = ['All', 'CSE', 'IT', 'CSBS', 'MECH', 'ECE', 'EEE', 'BIOTECH', 'AGRI'];

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dept, setDept] = useState('');
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
        setLoading(true);
        try {
            const params = buildParams();
            const [sum, fac, dist, trend, deptData] = await Promise.all([
                api.get('/analytics/summary', { params }),
                api.get('/analytics/by-faculty', { params }),
                api.get('/analytics/distribution', { params }),
                api.get('/analytics/trend', { params }),
                api.get('/analytics/by-department'),
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
    }, [buildParams]);

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
        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            transports: ['websocket'],
        });
        socketRef.current = socket;
        socket.on('feedbackUpdated', fetchAll);
        return () => socket.disconnect();
    }, [fetchAll]);

    // ── Faculty bar chart ────────────────────────────────────────────
    const facultyChart = data ? {
        labels: data.faculty.slice(0, 15).map(f => f.facultyName?.split(' ').slice(0, 2).join(' ') || '—'),
        datasets: [{
            label: 'Avg Rating',
            data: data.faculty.slice(0, 15).map(f => f.avgRating),
            backgroundColor: '#0047AB',
            borderRadius: 5,
        }],
    } : null;

    // ── Rating distribution pie ──────────────────────────────────────
    const pieDist = data?.dist ? {
        labels: Object.keys(data.dist).map(d => `${d} ★`),
        datasets: [{
            data: Object.values(data.dist),
            backgroundColor: ['#A7C7E7', '#6F8FAF', '#0047AB', '#088F8F', '#004080'],
            borderColor: '#fff',
            borderWidth: 2,
        }],
    } : null;

    // ── Semester trend line ──────────────────────────────────────────
    const trendChart = data?.trend?.length ? {
        labels: data.trend.map(t => t.label || `Sem ${t.semester}`),
        datasets: [{
            label: 'Avg Rating',
            data: data.trend.map(t => t.avgRating),
            borderColor: '#088F8F',
            backgroundColor: 'rgba(8,143,143,0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#088F8F',
            pointRadius: 5,
        }],
    } : null;

    // ── Department comparison bar ────────────────────────────────────
    const deptChart = data?.deptData?.length ? {
        labels: data.deptData.map(d => d.deptCode),
        datasets: [{
            label: 'Avg Rating',
            data: data.deptData.map(d => d.avgRating),
            backgroundColor: data.deptData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
            borderRadius: 5,
        }],
    } : null;

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
            <div className="dash-header">
                <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.15rem' }}>Faculty Feedback Analytics</h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        Anonymous · All submissions are aggregated and anonymised
                    </p>
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
                        style={{ background: '#0047AB', fontSize: '0.815rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
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
            <div className="dash-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span className="dash-filter-label" style={{ fontWeight: 600, color: '#475569' }}>Department Filter:</span>
                <select
                    className="fa-select"
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    style={{ minWidth: '150px' }}
                >
                    <option value="">All Departments</option>
                    {deptList.map(d => (
                        <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* ── Feedback Period Settings ───────── */}
                <div className="system-settings-panel" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', height: '100%' }}>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiAlertTriangle size={16} color="#088F8F" /> Feedback Period Settings</h3>
                        <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--clr-text-3)' }}>Control when students are allowed to submit or edit their feedback.</p>
                    </div>

                    <form onSubmit={handleUpdateSettings} style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ margin: 0, minWidth: '150px' }}>
                            <label style={{ fontSize: '0.8rem' }}>Status</label>
                            <select
                                value={settings.isFeedbackOpen.toString()}
                                onChange={(e) => setSettings({ ...settings, isFeedbackOpen: e.target.value === 'true' })}
                                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--clr-border-2)' }}
                            >
                                <option value="true">Open</option>
                                <option value="false">Closed</option>
                            </select>
                        </div>

                        <div className="input-group" style={{ margin: 0, minWidth: '200px' }}>
                            <label style={{ fontSize: '0.8rem' }}>Start Date (Optional)</label>
                            <input
                                type="datetime-local"
                                value={settings.feedbackStartDate}
                                onChange={(e) => setSettings({ ...settings, feedbackStartDate: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--clr-border-2)', width: '100%' }}
                            />
                        </div>

                        <div className="input-group" style={{ margin: 0, minWidth: '200px' }}>
                            <label style={{ fontSize: '0.8rem' }}>End Date (Optional)</label>
                            <input
                                type="datetime-local"
                                value={settings.feedbackDeadline}
                                onChange={(e) => setSettings({ ...settings, feedbackDeadline: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--clr-border-2)', width: '100%' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={updatingSettings}
                            style={{ height: '37px', padding: '0 1rem' }}
                        >
                            {updatingSettings ? 'Saving...' : 'Save Settings'}
                        </button>
                    </form>
                </div>

                {/* ── System Status ──────────────────── */}
                <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#69db7c' }} /> System Status
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#40c057' }} />
                            All systems operational
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0047AB' }} />
                            Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Loading...'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KPI Cards ───────────────────────────────── */}
            <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                <KpiCard
                    icon={<FiMessageSquare size={18} />}
                    label="Total Feedback" value={summary?.totalFeedback ?? 0}
                    sub="All-time anonymous submissions" color="#0047AB"
                />
                <KpiCard
                    icon={<FiStar size={18} />}
                    label="Overall Avg Rating"
                    value={`${fmt(summary?.avgOverallRating)} / 5`}
                    sub="Across all departments" color="#088F8F"
                />
                <KpiCard
                    icon={<FiLayers size={18} />}
                    label="Active Departments"
                    value={`${summary?.activeDepartments ?? 0} / ${summary?.totalDepartments ?? 8}`}
                    sub="With at least one feedback" color="#6F8FAF"
                />
                <KpiCard
                    icon={<FiBook size={18} />}
                    label="Subjects Rated"
                    value={summary?.subjectsRated ?? 0}
                    sub="Unique subjects with feedback" color="#A7C7E7"
                />
            </div>

            {/* ── Row 1: Faculty Bar + Rating Pie ─────────── */}
            <div className="charts-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3>Faculty Rating Comparison</h3>
                    </div>
                    <div style={{ height: 300 }}>
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
                    <div style={{ height: 300 }}>
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
                    <div style={{ height: 260 }}>
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
                    <div style={{ height: 260 }}>
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

const NoData = () => (
    <div className="empty-state">
        <FiInbox size={28} style={{ color: '#A7C7E7', marginBottom: '0.5rem' }} />
        <span>No data yet</span>
    </div>
);

export default AdminDashboard;
