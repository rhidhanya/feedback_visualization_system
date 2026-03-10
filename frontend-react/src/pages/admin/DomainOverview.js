import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import { FiGlobe, FiStar, FiAlertTriangle, FiMessageSquare, FiInbox } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

const CHART_COLORS = ['#A39382', '#685D54', '#E5DED2', '#FBF7F4']; // Taupe, Mocha, Oat, Milk

const DomainOverview = () => {
    const [stats, setStats] = useState([]);
    const [domains, setDomains] = useState([]);
    const [issueSummary, setIssueSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [detailAnalytics, setDetailAnalytics] = useState(null);
    const socketRef = useRef(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [sRes, dRes, iRes] = await Promise.all([
                api.get('/domain-feedback/analytics-all'),
                api.get('/domains?active=true'),
                api.get('/issues/summary'),
            ]);
            setStats(sRes.data.data || []);
            setDomains(dRes.data.data || []);
            setIssueSummary(iRes.data.data || {});
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', { transports: ['websocket'] });
        socketRef.current = socket;
        socket.on('domainFeedbackUpdated', fetchAll);
        return () => socket.disconnect();
    }, [fetchAll]);

    const viewDetail = async (slug) => {
        setSelectedDomain(slug);
        try {
            const res = await api.get(`/domain-feedback/analytics/${slug}`);
            setDetailAnalytics(res.data.data);
        } catch { setDetailAnalytics(null); }
    };

    if (loading) return <AdminLayout title="Domain Overview"><div className="loading-state"><div className="spinner" /><span>Loading…</span></div></AdminLayout>;

    const totalFeedback = stats.reduce((s, d) => s + d.totalFeedback, 0);
    const totalNeg = stats.reduce((s, d) => s + d.negativeFeedback, 0);

    const chart = stats.length ? {
        labels: stats.map(d => d._id?.charAt(0).toUpperCase() + d._id?.slice(1)),
        datasets: [{
            label: 'Avg Rating', data: stats.map(d => Math.round(d.avgRating * 100) / 100),
            backgroundColor: stats.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]), borderRadius: 5,
        }],
    } : null;

    return (
        <AdminLayout title="Domain Overview">
            <div className="admin-kpi-grid">
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiGlobe size={22} /></div>
                    <div className="info">
                        <span className="label">Total Domains</span>
                        <span className="value">{domains.length}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiMessageSquare size={22} /></div>
                    <div className="info">
                        <span className="label">Total Feedback</span>
                        <span className="value">{totalFeedback}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiAlertTriangle size={22} /></div>
                    <div className="info">
                        <span className="label">Negative Feedback</span>
                        <span className="value">{totalNeg}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiStar size={22} /></div>
                    <div className="info">
                        <span className="label">Active Domains</span>
                        <span className="value">{stats.length}</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="chart-card">
                    <div className="chart-card-header"><h3>Domain Rating Comparison</h3></div>
                    <div style={{ height: 300 }}>
                        {chart ? <Bar data={chart} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 5 } } }} /> : <Empty />}
                    </div>
                </div>
                <div className="chart-card" style={{ padding: '1rem' }}>
                    <div className="chart-card-header"><h3>Issue Summary</h3></div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead><tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: 8, textAlign: 'left' }}>Domain</th>
                            <th style={{ padding: 8 }}>Pending</th><th style={{ padding: 8 }}>In Progress</th>
                            <th style={{ padding: 8 }}>Rectified</th><th style={{ padding: 8 }}>Closed</th>
                        </tr></thead>
                        <tbody>{Object.entries(issueSummary).map(([d, c]) => (
                            <tr key={d} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: 8, fontWeight: 600 }}>{d?.charAt(0).toUpperCase() + d?.slice(1)}</td>
                                <td style={{ padding: 8, textAlign: 'center', color: '#685D54' }}>{c.Pending || 0}</td>
                                <td style={{ padding: 8, textAlign: 'center', color: '#A39382' }}>{c['In Progress'] || 0}</td>
                                <td style={{ padding: 8, textAlign: 'center', color: '#A39382' }}>{c.Rectified || 0}</td>
                                <td style={{ padding: 8, textAlign: 'center', color: '#94a3b8' }}>{c.Closed || 0}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', fontWeight: 700, color: 'var(--clr-text)' }}>Participating Domains</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {domains.map((d, i) => {
                    const s = stats.find(st => st._id === d.slug) || {};
                    const color = CHART_COLORS[i % CHART_COLORS.length];
                    return (
                        <div key={d._id} className="card-premium" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => viewDetail(d.slug)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h4 style={{ color: color, fontSize: '1.1rem', margin: 0 }}>{d.name}</h4>
                                <div className="icon-box-sm" style={{ background: `${color}15`, color: color }}>
                                    <FiGlobe size={16} />
                                </div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)', marginBottom: '1.25rem', height: '3.4rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{d.description}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                                <div style={{ color: 'var(--clr-text-3)' }}>Feedback: <strong style={{ color: 'var(--clr-text)' }}>{s.totalFeedback || 0}</strong></div>
                                <div style={{ color: 'var(--clr-text-3)' }}>Avg: <strong style={{ color: 'var(--clr-text)' }}>{s.avgRating?.toFixed(2) || '—'}★</strong></div>
                                <div style={{ color: 'var(--clr-text-3)' }}>Negative: <strong style={{ color: '#ff7675' }}>{s.negativeFeedback || 0}</strong></div>
                                <div style={{ color: 'var(--clr-text-3)' }}>Questions: <strong style={{ color: 'var(--clr-text)' }}>{d.questions?.length || 0}</strong></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detail modal */}
            {selectedDomain && detailAnalytics && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setSelectedDomain(null)}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1rem' }}>{selectedDomain.charAt(0).toUpperCase() + selectedDomain.slice(1)} — Detailed Analytics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: '1rem' }}>
                            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Avg Rating</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#006994' }}>{detailAnalytics.avgRating?.toFixed(2)}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0ABAB5' }}>{detailAnalytics.totalFeedback}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Negative</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>{detailAnalytics.negativeFeedback}</div>
                            </div>
                        </div>
                        {detailAnalytics.questionStats?.length > 0 && (
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: 8 }}>Question Breakdown</h4>
                                {detailAnalytics.questionStats.map((q, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.82rem' }}>
                                        <span style={{ color: '#475569' }}>{q.question}</span>
                                        <strong style={{ color: '#0ABAB5' }}>{q.avgRating?.toFixed(2)}★</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setSelectedDomain(null)} className="btn btn-primary" style={{ marginTop: '1rem', background: 'var(--clr-primary)', color: '#fff' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--clr-hover-bg)'; e.currentTarget.style.color = 'var(--clr-hover-text)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--clr-primary)'; e.currentTarget.style.color = '#fff'; }}>Close</button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

const KPI = ({ icon, label, value, color }) => (
    <div className="card-premium" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
        <div className="icon-box" style={{ background: `${color}15`, color: color }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--clr-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--clr-text)' }}>{value}</div>
        </div>
    </div>
);

const Empty = () => (
    <div className="empty-state" style={{ padding: '2rem 1rem' }}>
        <div className="icon-box" style={{ background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)', marginBottom: '1rem', borderRadius: '50%' }}>
            <FiInbox size={20} />
        </div>
        <span style={{ fontWeight: 600, color: 'var(--clr-text-2)', fontSize: '0.85rem' }}>No data available</span>
    </div>
);

export default DomainOverview;
