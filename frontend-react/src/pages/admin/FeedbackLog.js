import React, { useState, useEffect } from 'react';
import { FiClipboard } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

const ratingClass = (r) => r >= 4 ? 'rating-high' : r >= 2.5 ? 'rating-mid' : 'rating-low';

const FeedbackLog = () => {
    const [feedback, setFeedback] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const limit = 20;

    const [filters, setFilters] = useState({ department: '', semester: '' });

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const p = new URLSearchParams({ page, limit });
                if (filters.department) p.set('department', filters.department);
                if (filters.semester) p.set('semester', filters.semester);

                const [fbRes, deptRes] = await Promise.all([
                    api.get(`/feedback?${p}`),
                    api.get('/departments'),
                ]);
                setFeedback(fbRes.data.data);
                setTotal(fbRes.data.total);
                setDepartments(deptRes.data.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [page, filters]);

    const totalPages = Math.ceil(total / limit);

    return (
        <AdminLayout title="Feedback Log">
            <div className="page-header">
                <h2>Feedback Log</h2>
                <p>All submitted feedback from students — {total} total responses</p>
            </div>

            <div className="filter-bar" id="feedback-filter-bar">
                <div className="input-group">
                    <label>Department</label>
                    <select
                        id="fb-filter-dept"
                        value={filters.department}
                        onChange={e => { setFilters(p => ({ ...p, department: e.target.value })); setPage(1); }}
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="input-group">
                    <label>Semester</label>
                    <select
                        id="fb-filter-sem"
                        value={filters.semester}
                        onChange={e => { setFilters(p => ({ ...p, semester: e.target.value })); setPage(1); }}
                    >
                        <option value="">All Semesters</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="spinner-wrap"><div className="spinner" /></div>
            ) : feedback.length === 0 ? (
                <div className="empty-state">
                    <FiClipboard size={32} style={{ color: 'var(--clr-primary-lt)', marginBottom: '0.5rem' }} />
                    <h3>No feedback found</h3>
                    <p>Try adjusting the filters above.</p>
                </div>
            ) : (
                <>
                    <div className="table-wrap" id="feedback-log-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Roll No.</th>
                                    <th>Subject</th>
                                    <th>Faculty</th>
                                    <th>Dept</th>
                                    <th>Sem</th>
                                    <th>Overall</th>
                                    <th>Comments</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feedback.map(fb => (
                                    <tr key={fb._id}>
                                        <td style={{ fontWeight: 600 }}>{fb.studentId?.name || '—'}</td>
                                        <td style={{ color: 'var(--clr-text-3)', fontSize: '0.8125rem' }}>{fb.studentId?.rollNumber || '—'}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{fb.subjectId?.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>{fb.subjectId?.subjectCode}</div>
                                        </td>
                                        <td>{fb.subjectId?.facultyName}</td>
                                        <td>{fb.departmentId?.code}</td>
                                        <td>{fb.semester}</td>
                                        <td>
                                            <span className={`rating-chip ${ratingClass(fb.overallRating)}`}>
                                                {fb.overallRating}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--clr-text-3)', fontSize: '0.8rem' }}>
                                            {fb.comments || <em style={{ opacity: 0.4 }}>None</em>}
                                        </td>
                                        <td style={{ color: 'var(--clr-text-3)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                                            {new Date(fb.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                            <button id="prev-page-btn" className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                            <span style={{ color: 'var(--clr-text-3)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
                            <button id="next-page-btn" className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
                        </div>
                    )}
                </>
            )}
        </AdminLayout>
    );
};

export default FeedbackLog;
