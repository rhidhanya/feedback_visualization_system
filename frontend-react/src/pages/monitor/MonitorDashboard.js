import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import { FiMessageSquare, FiStar, FiAlertTriangle, FiGlobe, FiInbox } from 'react-icons/fi';
import MonitorLayout from '../../components/MonitorLayout';
import api from '../../api/axios';

const CHART_COLORS = ['#0ABAB5', '#006994', '#9BC4E2', '#8FE2E1'];

const MonitorDashboard = () => {
    const [domainStats, setDomainStats] = useState([]);
    const [issueSummary, setIssueSummary] = useState({});
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, issRes, domRes] = await Promise.all([
                api.get('/domain-feedback/analytics-all'),
                api.get('/issues/summary'),
                api.get('/domains?active=true'),
            ]);
            setDomainStats(statsRes.data.data || []);
            setIssueSummary(issRes.data.data || {});
            setDomains(domRes.data.data || []);
        } catch (err) {
            console.error('Monitor dashboard error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', { transports: ['websocket'] });
        socketRef.current = socket;
        socket.on('domainFeedbackUpdated', fetchAll);
        socket.on('issueStatusUpdated', fetchAll);
        return () => socket.disconnect();
    }, [fetchAll]);

    if (loading) return (
        <MonitorLayout title="Overview">
            <div className="loading-state"><div className="spinner" /><span>Loading overview…</span></div>
        </MonitorLayout>
    );

    const totalFeedback = domainStats.reduce((sum, d) => sum + d.totalFeedback, 0);
    const totalNegative = domainStats.reduce((sum, d) => sum + d.negativeFeedback, 0);
    const avgAll = domainStats.length > 0 ? (domainStats.reduce((sum, d) => sum + d.avgRating * d.totalFeedback, 0) / (totalFeedback || 1)) : 0;

    const comparisonChart = domainStats.length ? {
        labels: domainStats.map(d => d._id?.charAt(0).toUpperCase() + d._id?.slice(1)),
        datasets: [{
            label: 'Avg Rating', data: domainStats.map(d => Math.round(d.avgRating * 100) / 100),
            backgroundColor: domainStats.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]), borderRadius: 8,
            barThickness: 25,
        }],
    } : null;

    const negativeChart = domainStats.length ? {
        labels: domainStats.map(d => d._id?.charAt(0).toUpperCase() + d._id?.slice(1)),
        datasets: [{
            label: 'Negative Feedback', data: domainStats.map(d => d.negativeFeedback),
            backgroundColor: '#006994', borderRadius: 8,
            barThickness: 25,
        }],
    } : null;

    return (
        <MonitorLayout title="Monitoring Overview">
            {/* KPIs */}
            <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                <KPI icon={<FiGlobe size={18} />} label="Active Domains" value={domains.length} color="#0ABAB5" />
                <KPI icon={<FiMessageSquare size={18} />} label="Total Feedback" value={totalFeedback} color="#006994" />
                <KPI icon={<FiStar size={18} />} label="Overall Avg" value={`${avgAll.toFixed(2)} / 5`} color="#9BC4E2" />
                <KPI icon={<FiAlertTriangle size={18} />} label="Negative Alerts" value={totalNegative} color="#dc2626" />
            </div>

            {/* Charts */}
            <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="chart-card">
                    <div className="chart-card-header"><h3>Domain Rating Comparison</h3></div>
                    <div style={{ height: 300 }}>
                        {comparisonChart ? <Bar data={comparisonChart} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 5 } } }} /> : <Empty />}
                    </div>
                </div>
                <div className="chart-card">
                    <div className="chart-card-header"><h3>Negative Feedback by Domain</h3></div>
                    <div style={{ height: 300 }}>
                        {negativeChart ? <Bar data={negativeChart} options={{ responsive: true, maintainAspectRatio: false }} /> : <Empty />}
                    </div>
                </div>
            </div>

            {/* Domain Cards */}
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b' }}>Domain Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {domainStats.map((d, i) => {
                    const slug = d._id;
                    const issues = issueSummary[slug] || {};
                    const pending = (issues.Pending || 0) + (issues['In Progress'] || 0);
                    return (
                        <div key={slug} className="chart-card" style={{ padding: '1.25rem' }}>
                            <h4 style={{ fontSize: '1rem', color: CHART_COLORS[i % CHART_COLORS.length], marginBottom: '0.75rem' }}>
                                {slug?.charAt(0).toUpperCase() + slug?.slice(1)}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                                <div><span style={{ color: '#64748b' }}>Feedback:</span> <strong>{d.totalFeedback}</strong></div>
                                <div><span style={{ color: '#64748b' }}>Avg:</span> <strong>{d.avgRating?.toFixed(2)}★</strong></div>
                                <div><span style={{ color: '#64748b' }}>Negative:</span> <strong style={{ color: '#dc2626' }}>{d.negativeFeedback}</strong></div>
                                <div><span style={{ color: '#64748b' }}>Pending:</span> <strong style={{ color: '#f59e0b' }}>{pending}</strong></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Issue Summary */}
            <div className="chart-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Issue Status Summary</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Domain</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Pending</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>In Progress</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Rectified</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Closed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(issueSummary).map(([dom, counts]) => (
                            <tr key={dom} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{dom?.charAt(0).toUpperCase() + dom?.slice(1)}</td>
                                <td style={{ padding: '8px', textAlign: 'center', color: '#685D54', fontWeight: 600 }}>{counts.Pending || 0}</td>
                                <td style={{ padding: '8px', textAlign: 'center', color: '#A39382', fontWeight: 600 }}>{counts['In Progress'] || 0}</td>
                                <td style={{ padding: '8px', textAlign: 'center', color: '#A39382', fontWeight: 600 }}>{counts.Rectified || 0}</td>
                                <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{counts.Closed || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {Object.keys(issueSummary).length === 0 && <Empty />}
            </div>
        </MonitorLayout>
    );
};

const KPI = ({ icon, label, value, color }) => (
    <div className="kpi-card" style={{ '--kpi-color': color }}>
        <div className="kpi-icon" style={{ background: `${color}18`, color }}>{icon}</div>
        <div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value" style={{ color }}>{value}</div>
        </div>
    </div>
);

const Empty = () => (
    <div className="empty-state"><FiInbox size={28} style={{ color: 'var(--clr-primary-lt)', marginBottom: '0.5rem' }} /><span>No data yet</span></div>
);

export default MonitorDashboard;
