import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import {
    FiPlus, FiEdit2, FiTrash2, FiBook, FiSearch,
    FiX, FiCheck, FiAlertCircle, FiRefreshCw, FiToggleLeft, FiToggleRight, FiUsers, FiCheckCircle, FiShield
} from 'react-icons/fi';

const CURRENT_YEAR = (() => {
    const y = new Date().getFullYear();
    return `${y}-${String(y + 1).slice(-2)}`;
})();

const SubjectManagement = () => {
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterSem, setFilterSem] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [form, setForm] = useState({
        name: '', subjectCode: '', department: '', faculty: '',
        facultyName: '', semester: '', academicYear: CURRENT_YEAR, isActive: true
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchSubjects = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page: currentPage, limit: 10 };
            if (filterDept) params.department = filterDept;
            if (filterSem) params.semester = filterSem;
            const res = await api.get('/admin/subjects', { params });
            setSubjects(res.data.data || []);
            setTotalPages(res.data.pages || 1);
            setTotalItems(res.data.total || 0);
        } catch (err) {
            showToast('error', 'Failed to load subjects');
        } finally {
            setLoading(false);
        }
    }, [filterDept, filterSem, currentPage]);

    const fetchMeta = useCallback(async () => {
        try {
            const [deptRes, facRes] = await Promise.all([
                api.get('/departments'),
                api.get('/admin/faculty'),
            ]);
            setDepartments(deptRes.data.data || []);
            setFaculty(facRes.data.data || []);
        } catch { }
    }, []);

    useEffect(() => { fetchMeta(); }, [fetchMeta]);
    useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', subjectCode: '', department: '', faculty: '', facultyName: '', semester: '', academicYear: CURRENT_YEAR, isActive: true });
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (s) => {
        setEditing(s);
        setForm({
            name: s.name,
            subjectCode: s.subjectCode,
            department: s.department?._id || s.department || '',
            faculty: s.faculty?._id || s.faculty || '',
            facultyName: s.facultyName || '',
            semester: String(s.semester),
            academicYear: s.academicYear || CURRENT_YEAR,
            isActive: s.isActive !== false,
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            const updated = { ...prev, [name]: value };
            // Auto-fill facultyName when faculty is selected from dropdown
            if (name === 'faculty' && value) {
                const sel = faculty.find(f => f._id === value);
                if (sel) updated.facultyName = sel.name;
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.name || !form.subjectCode || !form.department || !form.semester || !form.academicYear) {
            setFormError('Subject Name, Code, Department, Semester, and Academic Year are required.');
            return;
        }
        if (!form.faculty && !form.facultyName) {
            setFormError('Please assign a faculty or enter a faculty name.');
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                name: form.name,
                subjectCode: form.subjectCode.toUpperCase(),
                department: form.department,
                faculty: form.faculty || undefined,
                facultyName: form.facultyName,
                semester: Number(form.semester),
                academicYear: form.academicYear,
                isActive: form.isActive,
            };

            if (editing) {
                await api.put(`/admin/subjects/${editing._id}`, payload);
                showToast('success', 'Subject updated');
            } else {
                await api.post('/admin/subjects', payload);
                showToast('success', 'Subject created');
            }
            setModalOpen(false);
            fetchSubjects();
        } catch (err) {
            setFormError(err.response?.data?.message || 'An error occurred. Try again.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleActive = async (subject) => {
        try {
            await api.put(`/admin/subjects/${subject._id}`, { isActive: !subject.isActive });
            showToast('success', `Subject ${subject.isActive ? 'deactivated' : 'activated'}`);
            fetchSubjects();
        } catch {
            showToast('error', 'Failed to update subject status');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/admin/subjects/${id}`);
            setDeleteConfirm(null);
            showToast('success', 'Subject deleted');
            fetchSubjects();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to delete');
        }
    };

    const filtered = subjects.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.subjectCode?.toLowerCase().includes(search.toLowerCase()) ||
        s.facultyName?.toLowerCase().includes(search.toLowerCase()) ||
        s.department?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const semOptions = [1, 2, 3, 4, 5, 6, 7, 8];

    return (
        <AdminLayout title="Subject Management">
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    background: toast.type === 'success' ? 'var(--clr-accent)' : 'var(--clr-danger)',
                    color: '#fff', padding: '0.75rem 1.25rem', borderRadius: 8,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}>
                    {toast.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.15rem' }}>Subject Management</h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Add subjects and assign them to departments, semesters, and faculty.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={fetchSubjects} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiRefreshCw size={14} /> Refresh
                    </button>
                    <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiPlus size={15} /> Add Subject
                    </button>
                </div>
            </div>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiBook size={22} /></div>
                    <div className="info">
                        <span className="label">Total Subjects</span>
                        <span className="value">{totalItems}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiUsers size={22} /></div>
                    <div className="info">
                        <span className="label">Faculty Mapped</span>
                        <span className="value">{subjects.filter(s => s.faculty || s.facultyName).length}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiCheckCircle size={22} /></div>
                    <div className="info">
                        <span className="label">Active Subjects</span>
                        <span className="value">{subjects.filter(s => s.isActive).length}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiShield size={22} /></div>
                    <div className="info">
                        <span className="label">Curriculum</span>
                        <span className="value">v2.1</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar card-premium" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', padding: '1.5rem', alignItems: 'flex-end', background: 'var(--clr-surface)' }}>
                <div className="input-group" style={{ margin: 0, flex: 2 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Search Subjects</label>
                    <div style={{ position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by Name, Code or Faculty..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: '2.75rem', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', width: '100%', color: 'var(--clr-text-on-oat)', padding: '0.65rem 0.65rem 0.65rem 2.75rem' }}
                        />
                    </div>
                </div>
                <div className="input-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Department</label>
                    <select
                        style={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', padding: '0.65rem', width: '100%', color: 'var(--clr-text-on-oat)' }}
                        value={filterDept}
                        onChange={e => setFilterDept(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, flex: 0.8 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Semester</label>
                    <select
                        style={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', padding: '0.65rem', width: '100%', color: 'var(--clr-text-on-oat)' }}
                        value={filterSem}
                        onChange={e => setFilterSem(e.target.value)}
                    >
                        <option value="">All Semesters</option>
                        {semOptions.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-state"><div className="spinner" /><span>Loading subjects…</span></div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Code</th>
                                <th>Department</th>
                                <th>Semester</th>
                                <th>Faculty</th>
                                <th>Year</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--clr-text-3)' }}>
                                        {search || filterDept || filterSem ? 'No subjects match your filters.' : 'No subjects yet. Click "Add Subject" to get started.'}
                                    </td>
                                </tr>
                            ) : filtered.map(s => (
                                <tr key={s._id}>
                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                    <td><span className="subject-code" style={{ fontSize: '0.75rem' }}>{s.subjectCode}</span></td>
                                    <td style={{ fontSize: '0.875rem' }}>{s.department?.name || '—'}</td>
                                    <td style={{ textAlign: 'center', fontSize: '0.875rem' }}>Sem {s.semester}</td>
                                    <td style={{ fontSize: '0.875rem' }}>{s.faculty?.name || s.facultyName || '—'}</td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-text-3)' }}>{s.academicYear}</td>
                                    <td>
                                        <button onClick={() => handleToggleActive(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: s.isActive ? 'var(--clr-accent)' : 'var(--clr-text-3)' }}>
                                            {s.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                                            {s.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button className="btn btn-ghost" style={{ padding: '0.3rem 0.55rem', fontSize: '0.8rem' }} onClick={() => openEdit(s)}>
                                                <FiEdit2 size={13} /> Edit
                                            </button>
                                            <button className="btn btn-danger" style={{ padding: '0.3rem 0.55rem', fontSize: '0.8rem' }} onClick={() => setDeleteConfirm(s)}>
                                                <FiTrash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', background: '#fff', padding: '1rem', borderRadius: 10, border: '1px solid var(--clr-border)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--clr-text-2)' }}>
                        Showing <strong>{subjects.length}</strong> of <strong>{totalItems}</strong> subjects
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.875rem' }}>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                className="btn btn-ghost" 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                            >
                                ← Previous
                            </button>
                            <button 
                                className="btn btn-primary" 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem' }}>{editing ? 'Edit Subject' : 'Add New Subject'}</h3>
                            <button className="btn btn-ghost" style={{ padding: '0.3rem' }} onClick={() => setModalOpen(false)}><FiX size={18} /></button>
                        </div>

                        {formError && (
                            <div style={{ background: 'var(--clr-danger-lt)', border: '1px solid var(--clr-danger-lt)', borderRadius: 8, padding: '0.625rem 0.875rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--clr-danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <FiAlertCircle size={14} /> {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label>Subject Name</label>
                                    <input type="text" name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. Data Structures" required />
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label>Subject Code</label>
                                    <input type="text" name="subjectCode" value={form.subjectCode} onChange={handleFormChange} placeholder="e.g. CS301" required style={{ textTransform: 'uppercase' }} />
                                </div>
                            </div>

                            <div className="input-group" style={{ margin: 0 }}>
                                <label>Department</label>
                                <select name="department" value={form.department} onChange={handleFormChange} required>
                                    <option value="">Select department…</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label>Semester</label>
                                    <select name="semester" value={form.semester} onChange={handleFormChange} required>
                                        <option value="">Select…</option>
                                        {semOptions.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                    </select>
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label>Academic Year</label>
                                    <input type="text" name="academicYear" value={form.academicYear} onChange={handleFormChange} placeholder="2024-25" required />
                                </div>
                            </div>

                            <div className="input-group" style={{ margin: 0 }}>
                                <label>Assign Faculty (from accounts)</label>
                                <select name="faculty" value={form.faculty} onChange={handleFormChange}>
                                    <option value="">— Select a faculty account —</option>
                                    {faculty.map(f => (
                                        <option key={f._id} value={f._id}>{f.name} ({f.department?.code || 'N/A'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group" style={{ margin: 0 }}>
                                <label>Faculty Name <span style={{ color: 'var(--clr-text-3)', fontWeight: 400 }}>(or enter manually if not in system)</span></label>
                                <input type="text" name="facultyName" value={form.facultyName} onChange={handleFormChange} placeholder="Auto-filled when faculty selected above" />
                            </div>

                            <div className="input-group" style={{ margin: 0 }}>
                                <label>Status</label>
                                <select name="isActive" value={form.isActive.toString()} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}>
                                    <option value="true">Active (students can submit feedback)</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FiBook size={14} />
                                    {formLoading ? 'Saving…' : editing ? 'Save Changes' : 'Create Subject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', maxWidth: 400, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                        <h3 style={{ marginBottom: '0.75rem' }}>Delete Subject?</h3>
                        <p style={{ color: 'var(--clr-text-2)', marginBottom: '1.5rem' }}>
                            Delete <strong>{deleteConfirm.name} ({deleteConfirm.subjectCode})</strong>? This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => handleDelete(deleteConfirm._id)}>
                                <FiTrash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default SubjectManagement;
