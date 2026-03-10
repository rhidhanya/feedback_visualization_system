import React, { useState, useEffect, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { FiInbox } from 'react-icons/fi';
import MonitorLayout from '../../components/MonitorLayout';
import api from '../../api/axios';

const CHART_COLORS = ['#0ABAB5', '#006994', '#9BC4E2', '#8FE2E1'];

const MonitorDomains = () => {
    const [domains, setDomains] = useState([]);
    const [stats, setStats] = useState([]);
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [dRes, sRes] = await Promise.all([
                api.get('/domains?active=true'),
                api.get('/domain-feedback/analytics-all'),
            ]);
            setDomains(dRes.data.data || []);
            setStats(sRes.data.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const viewDetail = async (slug) => {
        setSelected(slug);
        try {
            const res = await api.get(`/domain-feedback/analytics/${slug}`);
            setDetail(res.data.data);
        } catch { setDetail(null); }
    };

    if (loading) return <MonitorLayout title="Domain Analytics"><div className="loading-state"><div className="spinner" /></div></MonitorLayout>;

    const chart = stats.length ? {
        labels: stats.map(d => d._id?.charAt(0).toUpperCase() + d._id?.slice(1)),
        datasets: [{
            label: 'Avg Rating', data: stats.map(d => Math.round(d.avgRating * 100) / 100),
            backgroundColor: stats.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]), borderRadius: 5,
        }],
    } : null;

    return (
        <MonitorLayout title="Domain Analytics">
            <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
                <div className="chart-card-header"><h3>All Domains — Average Rating</h3></div>
                <div style={{ height: 300 }}>
                    {chart ? <Bar data={chart} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 5 } } }} /> : <div className="empty-state"><FiInbox size={28} /><span>No data</span></div>}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {domains.map((d, i) => {
                    const s = stats.find(st => st._id === d.slug) || {};
                    return (
                        <div key={d._id} className="chart-card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => viewDetail(d.slug)}>
                            <h4 style={{ color: CHART_COLORS[i % CHART_COLORS.length], marginBottom: 6 }}>{d.name}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '0.82rem' }}>
                                <div>Total: <strong>{s.totalFeedback || 0}</strong></div>
                                <div>Avg: <strong>{s.avgRating?.toFixed(2) || '—'}★</strong></div>
                                <div>Negative: <strong style={{ color: 'var(--clr-danger)' }}>{s.negativeFeedback || 0}</strong></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selected && detail && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelected(null)}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 550, width: '90%', maxHeight: '70vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1rem' }}>{selected.charAt(0).toUpperCase() + selected.slice(1)} Analytics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: '1rem' }}>
                            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Avg</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#006994' }}>{detail.avgRating?.toFixed(2)}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0ABAB5' }}>{detail.totalFeedback}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Negative</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#dc2626' }}>{detail.negativeFeedback}</div>
                            </div>
                        </div>
                        {detail.questionStats?.map((q, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.82rem' }}>
                                <span style={{ color: '#475569' }}>{q.question}</span>
                                <strong>{q.avgRating?.toFixed(2)}★</strong>
                            </div>
                        ))}
                        <button onClick={() => setSelected(null)} className="btn btn-primary" style={{ marginTop: '1rem', background: 'var(--clr-primary)', color: '#fff' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--clr-hover-bg)'; e.currentTarget.style.color = 'var(--clr-hover-text)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--clr-primary)'; e.currentTarget.style.color = '#fff'; }}>Close</button>
                    </div>
                </div>
            )}
        </MonitorLayout>
    );
};

export default MonitorDomains;
