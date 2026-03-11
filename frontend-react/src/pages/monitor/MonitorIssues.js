import React, { useState, useEffect, useCallback } from 'react';
import { FiInbox } from 'react-icons/fi';
import MonitorLayout from '../../components/MonitorLayout';
import api from '../../api/axios';

const STATUS_COLORS = { Pending: 'var(--clr-primary)', 'In Progress': 'var(--clr-accent)', Rectified: 'var(--clr-success)', Closed: 'var(--clr-text-3)' };

const MonitorIssues = () => {
    const [issues, setIssues] = useState([]);
    const [issueSummary, setIssueSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [iRes, sRes] = await Promise.all([
                api.get('/issues' + (filter ? `?domain=${filter}` : '')),
                api.get('/issues/summary'),
            ]);
            setIssues(iRes.data.data || []);
            setIssueSummary(sRes.data.data || {});
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return (
        <MonitorLayout title="Issue Tracker">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem' }}>Issue Tracker</h2>
                <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                    <option value="">All Domains</option>
                    {['transport', 'mess', 'hostel', 'sanitation'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
            </div>

            {/* Summary */}
            <div className="chart-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--clr-border)' }}>
                            <th style={{ padding: 12, textAlign: 'left' }}>Domain</th>
                            <th style={{ padding: 12 }}>Pending</th><th style={{ padding: 12 }}>In Progress</th>
                            <th style={{ padding: 12 }}>Rectified</th><th style={{ padding: 12 }}>Closed</th>
                        </tr></thead>
                        <tbody>{Object.entries(issueSummary).map(([d, c]) => (
                            <tr key={d} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                                <td style={{ padding: 12, fontWeight: 600 }}>{d?.charAt(0).toUpperCase() + d?.slice(1)}</td>
                                <td style={{ padding: 12, textAlign: 'center', color: 'var(--clr-primary)', fontWeight: 600 }}>{c.Pending || 0}</td>
                                <td style={{ padding: 12, textAlign: 'center', color: 'var(--clr-accent)', fontWeight: 600 }}>{c['In Progress'] || 0}</td>
                                <td style={{ padding: 12, textAlign: 'center', color: 'var(--clr-success)', fontWeight: 600 }}>{c.Rectified || 0}</td>
                                <td style={{ padding: 12, textAlign: 'center', color: 'var(--clr-text-3)', fontWeight: 600 }}>{c.Closed || 0}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>

            {/* Issue list */}
            <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div className="loading-state"><div className="spinner" /></div> :
                    issues.length === 0 ? (
                        <div className="empty-state" style={{ padding: '3rem' }}><FiInbox size={28} style={{ color: 'var(--clr-primary-lt)' }} /><span>No issues</span></div>
                    ) : (
                        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                            {issues.map(iss => (
                                <div key={iss._id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ fontSize: '0.88rem' }}>{iss.notificationId?.title || 'Issue'}</strong>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{iss.domain}</span>
                                            <span style={{ background: `${STATUS_COLORS[iss.status]}18`, color: STATUS_COLORS[iss.status], padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>{iss.status}</span>
                                        </div>
                                    </div>
                                    {iss.headResponse && <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4, fontStyle: 'italic' }}>Head: {iss.headResponse}</p>}
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </MonitorLayout>
    );
};

export default MonitorIssues;
