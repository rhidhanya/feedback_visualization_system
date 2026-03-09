import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import { FiGlobe, FiStar, FiAlertTriangle, FiMessageSquare, FiInbox } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

const CHART_COLORS = ['#0047AB', '#088F8F', '#6F8FAF', '#A7C7E7', '#f59e0b'];

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
            <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                <KPI icon={<FiGlobe size={18} />} label="Total Domains" value={domains.length} color="#0047AB" />
                <KPI icon={<FiMessageSquare size={18} />} label="Total Feedback" value={totalFeedback} color="#088F8F" />
                <KPI icon={<FiAlertTriangle size={18} />} label="Negative (≤2★)" value={totalNeg} color="#dc2626" />
                <KPI icon={<FiStar size={18} />} label="Domains Active" value={stats.length} color="#6F8FAF" />
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
                                <td style={{ padding: 8, textAlign: 'center', color: '#f59e0b' }}>{c.Pending || 0}</td>
                                <td style={{ padding: 8, textAlign: 'center', color: '#3b82f6' }}>{c['In Progress'] || 0}</td>
                                <td style={{ padding: 8, textAlign: 'center', color: '#10b981' }}>{c.Rectified || 0}</td>
                                <td style={{ padding: 8, textAlign: 'center', color: '#94a3b8' }}>{c.Closed || 0}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Domains</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {domains.map((d, i) => {
                    const s = stats.find(st => st._id === d.slug) || {};
                    return (
                        <div key={d._id} className="chart-card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => viewDetail(d.slug)}>
                            <h4 style={{ color: CHART_COLORS[i % CHART_COLORS.length], marginBottom: 8 }}>{d.name}</h4>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>{d.description}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '0.82rem' }}>
                                <div>Feedback: <strong>{s.totalFeedback || 0}</strong></div>
                                <div>Avg: <strong>{s.avgRating?.toFixed(2) || '—'}★</strong></div>
                                <div>Negative: <strong style={{ color: '#dc2626' }}>{s.negativeFeedback || 0}</strong></div>
                                <div>Questions: <strong>{d.questions?.length || 0}</strong></div>
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
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0047AB' }}>{detailAnalytics.avgRating?.toFixed(2)}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#088F8F' }}>{detailAnalytics.totalFeedback}</div>
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
                                        <strong style={{ color: '#0047AB' }}>{q.avgRating?.toFixed(2)}★</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setSelectedDomain(null)} className="btn btn-primary" style={{ marginTop: '1rem', background: '#0047AB' }}>Close</button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

const KPI = ({ icon, label, value, color }) => (
    <div className="kpi-card" style={{ '--kpi-color': color }}>
        <div className="kpi-icon" style={{ background: `${color}18`, color }}>{icon}</div>
        <div><div className="kpi-label">{label}</div><div className="kpi-value" style={{ color }}>{value}</div></div>
    </div>
);

const Empty = () => (
    <div className="empty-state"><FiInbox size={28} style={{ color: '#A7C7E7', marginBottom: '0.5rem' }} /><span>No data yet</span></div>
);

export default DomainOverview;
