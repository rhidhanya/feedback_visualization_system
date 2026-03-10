import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import { FiUsers, FiInbox, FiShield } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import './FacultyAnalytics.css';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, Title, Tooltip, Legend, Filler
);

// ── Shared chart styling (white-bg friendly) ───────────────────────────────
const GRID = '#e2e8f0';
const TEXT = '#475569';
const TIP = {
    backgroundColor: '#fff',
    titleColor: '#0f172a',
    bodyColor: '#475569',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 10,
};
const TICK = { color: TEXT, font: { family: 'Inter', size: 11 } };
const LEG = { color: TEXT, font: { family: 'Inter', size: 12 }, padding: 14 };


// Strict palette – consistent colors
const CHART_COLORS = ['#0ABAB5', '#006994', '#9BC4E2', '#8FE2E1'];
const ACCENT = CHART_COLORS;

const performanceBadge = (r) => {
    if (!r) return { label: '—', color: '#64748b' };
    if (r >= 4.5) return { label: 'Excellent', color: '#1E4DB7' };
    if (r >= 3.5) return { label: 'Good', color: '#1C8C8C' };
    if (r >= 2.5) return { label: 'Average', color: '#6E8CA8' };
    return { label: 'Needs Attention', color: '#E53935' };
};

// ── Filter controls ────────────────────────────────────────────────────────
const CLUSTERS = ['All', 'CS Cluster', 'Core Cluster'];
const DEPTS = ['All', 'CSE', 'IT', 'CSBS', 'MECH', 'ECE', 'EEE', 'BIOTECH', 'AGRI'];
// ── FacultyAnalytics page ──────────────────────────────────────────────────
const FacultyAnalytics = () => {
    const [facultyList, setFacultyList] = useState([]);
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState(null);

    const [detailLoading, setDetailLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterCluster, setFilterCluster] = useState('All');
    const [filterDept, setFilterDept] = useState('All');
    const [filterSem, setFilterSem] = useState('All');
    const socketRef = useRef(null);

    const loadFaculty = useCallback(async () => {
        try {
            const res = await api.get('/analytics/faculty-list');
            setFacultyList(res.data.data || []);
        } catch (err) {
            console.error('faculty-list error:', err);
        }
    }, []);

    const loadDetail = useCallback(async (name, sem = 'All') => {
        setDetailLoading(true);
        try {
            const res = await api.get(`/analytics/faculty-detail?name=${encodeURIComponent(name)}&semester=${sem}`);
            setDetail(res.data.data);
        } catch (err) {
            console.error('faculty-detail error:', err);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => { loadFaculty(); }, [loadFaculty]);
    
    useEffect(() => { 
        if (selected) {
            loadDetail(selected.facultyName, filterSem);
        }
    }, [selected, filterSem, loadDetail]);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', { 
            transports: ['websocket', 'polling'],
            reconnectionDelay: 1000,
            reconnection: true,
            reconnectionAttempts: 5,
        });
        socketRef.current = socket;
        
        socket.on('connect', () => {
            console.log('Socket connected');
        });
        
        socket.on('feedbackUpdated', () => {
            console.log('Feedback updated, reloading...');
            loadFaculty();
            if (selected) {
                loadDetail(selected.facultyName, filterSem);
            }
        });
        
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
        
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [loadFaculty, loadDetail, selected, filterSem]);

    const filtered = facultyList.filter(f => {
        if (search && !f.facultyName.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterCluster !== 'All' && f.cluster !== filterCluster) return false;
        if (filterDept !== 'All' && f.deptCode !== filterDept) return false;
        return true;
    }).sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));

    useEffect(() => {
        if (!selected && filtered.length) setSelected(filtered[0]);
    }, [filtered, selected]);

    return (
        <AdminLayout title="Faculty Analytics">
            <div style={{ paddingBottom: '2rem' }}>
                {/* ── Top Filter Bar ────────────────────────────── */}
                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ flex: '1 1 250px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Select Faculty</label>
                        <select 
                            className="fa-select" 
                            style={{ width: '100%', padding: '0.6rem', fontSize: '0.95rem' }}
                            value={selected?.facultyName || ''}
                            onChange={(e) => setSelected(filtered.find(f => f.facultyName === e.target.value) || null)}
                        >
                            {filtered.length === 0 ? <option value="">No faculty match filters</option> : null}
                            {filtered.map(f => <option key={f.facultyName} value={f.facultyName}>{f.facultyName} ({f.deptCode})</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Cluster Filter</label>
                        <select className="fa-select" style={{ width: '100%', padding: '0.6rem' }} value={filterCluster} onChange={e => setFilterCluster(e.target.value)}>
                            {CLUSTERS.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Department Filter</label>
                        <select className="fa-select" style={{ width: '100%', padding: '0.6rem' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                            {DEPTS.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 250px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Search Faculty</label>
                        <input
                            className="fa-search"
                            style={{ width: '100%', padding: '0.6rem' }}
                            placeholder="Type a name…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* ── Detail Panel ───────────────────────────── */}
                <main className="fa-detail">
                    {!selected ? (
                        <div className="fa-placeholder">
                            <FiUsers size={42} style={{ color: 'var(--clr-primary-lt)' }} />
                            <p>Select a faculty member to view analytics</p>
                        </div>
                    ) : detailLoading ? (
                        <div className="fa-placeholder"><div className="fa-spinner" /></div>
                    ) : !detail ? (
                        <FacultyOverviewOnly faculty={selected} />
                    ) : (
                        <FacultyDetailView faculty={selected} detail={detail} filterSem={filterSem} setFilterSem={setFilterSem} />
                    )}
                </main>

                {/* ── End Detail Panel ───────────────────────── */}
            </div>
        </AdminLayout>
    );
};

// ── Faculty detail when no feedback data yet ──────────────────────────────
const FacultyOverviewOnly = ({ faculty }) => (
    <div className="fa-card fa-empty-card">
        <h2 className="fa-name">{faculty.facultyName}</h2>
        <p style={{ color: '#64748b' }}>{faculty.deptName} · {faculty.cluster}</p>
        <div className="fa-no-data">
            <FiInbox size={22} style={{ marginRight: '0.5rem', color: 'var(--clr-primary-lt)' }} />
            No feedback submitted yet for this faculty
        </div>
    </div>
);

// ── Full detail view ──────────────────────────────────────────────────────
const FacultyDetailView = ({ faculty, detail, filterSem, setFilterSem }) => {
    const { overall, bySubject, trend, anonymousComments, availableSemesters } = detail;
    const badge = performanceBadge(overall?.avgRating);
    const filteredSubjects = bySubject;


    // Semester trend line
    const trendData = {
        labels: trend.map(t => t.label || `Sem ${t.semester}`),
        datasets: [{
            label: 'Avg Rating',
            data: trend.map(t => t.avgRating || 0),
            borderColor: '#0ABAB5',
            backgroundColor: 'rgba(10, 186, 181, 0.1)',
            fill: true, tension: 0.4,
            pointRadius: 5, pointBackgroundColor: '#0ABAB5',
            pointHoverRadius: 7
        }],
    };

    // Subject avg bar
    const subjBarData = {
        labels: filteredSubjects.map(s => s.subjectCode || s.name?.slice(0, 18)),
        datasets: [{
            label: 'Avg Rating',
            data: filteredSubjects.map(s => s.avgRating || 0),
            backgroundColor: filteredSubjects.map((_, i) => ACCENT[i % ACCENT.length]),
            borderRadius: 8,
            barThickness: 20
        }],
    };

    // Bar chart opts

    const chartOpts = () => ({
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: LEG },
            tooltip: { ...TIP, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${(ctx.parsed.y ?? ctx.parsed.x ?? '—').toFixed(2)}` } },
        },
        scales: {
            x: { ticks: TICK, grid: { display: false } },
            y: { min: 0, max: 5, ticks: TICK, grid: { color: GRID } },
        },
    });

    return (
        <div className="fa-detail-inner">
            {/* ── Header card ──────────────────────────────── */}
            <div className="fa-hero-card">
                <div className="fa-hero-avatar">{faculty.facultyName[0]}</div>
                <div className="fa-hero-info">
                    <h2 className="fa-name">{faculty.facultyName}</h2>
                    <p className="fa-meta">{faculty.deptName} · {faculty.cluster} · {faculty.subjectCount} subjects</p>
                    <span className="fa-badge" style={{ background: badge.color + '18', color: badge.color, border: `1px solid ${badge.color}44` }}>
                        {badge.label}
                    </span>
                </div>
                {/* Overall KPIs */}
                <div className="fa-kpis">
                    <div className="fa-kpi"><div className="fa-kpi-val">{overall?.avgRating ?? '—'}</div><div className="fa-kpi-lbl">Avg Rating</div></div>
                    <div className="fa-kpi"><div className="fa-kpi-val">{overall?.totalFeedback ?? 0}</div><div className="fa-kpi-lbl">Feedback</div></div>
                    <div className="fa-kpi"><div className="fa-kpi-val">{detail.subjectsTaught?.length ?? 0}</div><div className="fa-kpi-lbl">Total Subjects</div></div>
                </div>
            </div>

            {/* ── Semester filter ──────────────────────── */}
            <div className="fa-sem-filter" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--clr-border)' }}>
                <span className="fa-sem-label" style={{ fontWeight: 600, color: 'var(--clr-text-2)' }}>Semester</span>
                <select
                    className="fa-select"
                    value={filterSem}
                    onChange={e => setFilterSem(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                    style={{ minWidth: '150px' }}
                >
                    <option value="All">All Semesters</option>
                    {(availableSemesters || []).map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                    ))}
                </select>
            </div>

            {/* ── Row 1: Semester Trend & Subject Avg ────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card-premium" style={{ background: '#fff', padding: '1.75rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Semester Rating Trend</h3>
                    <div style={{ height: 280 }}>
                        {trend.length ? (
                            <Line data={trendData} options={chartOpts()} />
                        ) : <NoData />}
                    </div>
                </div>
                <div className="card-premium" style={{ background: '#fff', padding: '1.75rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Subject Average Rating</h3>
                    <div style={{ height: 280 }}>
                        {filteredSubjects.length ? (
                            <Bar data={subjBarData} options={{
                                ...chartOpts(),
                                plugins: { ...chartOpts().plugins, legend: { display: false } },
                            }} />
                        ) : <NoData msg="No subjects for this semester" />}
                    </div>
                </div>
            </div>

            {/* ── Anonymous comments ──────────────────── */}
            <div className="card-premium" style={{ background: '#fff', padding: '1.75rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                    <FiShield size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle', color: 'var(--clr-primary)' }} />
                    Anonymous Comments
                    <span className="fa-card-sub"> — Student identity hidden</span>
                </h3>
                {anonymousComments.length === 0 ? (
                    <div className="fa-no-data">No feedback available</div>
                ) : (
                    <div className="fa-comments">
                        {anonymousComments.map((c, i) => (
                            <div key={i} className="fa-comment">
                                <div className="fa-comment-meta">
                                    <span className="fa-comment-subj">{c.subject}</span>
                                    <span className="fa-comment-sem">Sem {c.semester}</span>
                                    <span className="fa-comment-rating">★ {c.rating?.toFixed(1)}</span>
                                </div>
                                <p className="fa-comment-text">"{c.comment}"</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Anonymous disclaimer ─────────────────── */}
            <div className="fa-anon-notice">
                <FiShield size={13} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                All feedback shown is aggregated and anonymous. No student identity is revealed.
            </div>
        </div>
    );
};

const NoData = ({ msg = 'No data yet' }) => (
    <div className="fa-no-data" style={{ height: '100%', flexDirection: 'column', gap: '0.5rem' }}>
        <FiInbox size={24} style={{ color: 'var(--clr-p-muted)' }} />
        <span>{msg}</span>
    </div>
);

export default FacultyAnalytics;
