import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import {
    FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiBook,
    FiSearch, FiX, FiCheck, FiAlertCircle, FiRefreshCw
} from 'react-icons/fi';

const FacultyManagement = () => {
    const [faculty, setFaculty] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState(null);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const [form, setForm] = useState({
        name: '', email: '', password: '', department: '', assignedSubjects: [], facultyId: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchFaculty = useCallback(async () => {
        try {
            setLoading(true);
            const [facRes, deptRes] = await Promise.all([
                api.get(`/admin/faculty?page=${currentPage}&limit=10`),
                api.get('/departments'),
            ]);
            setFaculty(facRes.data.data || []);
            setTotalPages(facRes.data.pages || 1);
            setTotalItems(facRes.data.total || 0);
            setDepartments(deptRes.data.data || []);
        } catch (err) {
            showToast('error', 'Failed to load faculty data');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    const fetchSubjectsForDept = async (deptId) => {
        if (!deptId) { setSubjects([]); return; }
        try {
            const res = await api.get(`/admin/subjects?department=${deptId}`);
            setSubjects(res.data.data || []);
        } catch { setSubjects([]); }
    };

    useEffect(() => { fetchFaculty(); }, [fetchFaculty]);

    useEffect(() => {
        if (form.department) fetchSubjectsForDept(form.department);
    }, [form.department]);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const openCreate = () => {
        setEditingFaculty(null);
        setForm({ name: '', email: '', password: '', department: '', assignedSubjects: [] });
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (f) => {
        setEditingFaculty(f);
        setForm({
            name: f.name,
            email: f.email,
            password: '',
            department: f.department?._id || f.department || '',
            assignedSubjects: (f.assignedSubjects || []).map(s => s._id || s),
            facultyId: f.facultyId || '',
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value, checked } = e.target;
        if (name === 'assignedSubjects') {
            setForm(prev => ({
                ...prev,
                assignedSubjects: checked
                    ? [...prev.assignedSubjects, value]
                    : prev.assignedSubjects.filter(id => id !== value),
            }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.name || !form.email || !form.department) {
            setFormError('Name, email, and department are required.');
            return;
        }
        if (!editingFaculty && !form.password) {
            setFormError('Password is required when creating a faculty account.');
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                department: form.department,
                assignedSubjects: form.assignedSubjects,
                facultyId: form.facultyId,
            };
            if (form.password) payload.password = form.password;

            if (editingFaculty) {
                await api.put(`/admin/faculty/${editingFaculty._id}`, payload);
                showToast('success', 'Faculty updated successfully');
            } else {
                await api.post('/admin/faculty', payload);
                showToast('success', 'Faculty account created successfully');
            }
            setModalOpen(false);
            fetchFaculty();
        } catch (err) {
            setFormError(err.response?.data?.message || 'An error occurred. Try again.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/admin/faculty/${id}`);
            setDeleteConfirm(null);
            showToast('success', 'Faculty deleted');
            fetchFaculty();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to delete faculty');
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSorted = faculty
        .filter(f =>
            f.name?.toLowerCase().includes(search.toLowerCase()) ||
            f.email?.toLowerCase().includes(search.toLowerCase()) ||
            f.department?.name?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            let aVal, bVal;
            if (sortConfig.key === 'name') { aVal = (a.name || '').toLowerCase(); bVal = (b.name || '').toLowerCase(); }
            else if (sortConfig.key === 'facultyId') { aVal = (a.facultyId || '').toLowerCase(); bVal = (b.facultyId || '').toLowerCase(); }
            else if (sortConfig.key === 'department') { aVal = (a.department?.name || '').toLowerCase(); bVal = (b.department?.name || '').toLowerCase(); }
            else if (sortConfig.key === 'status') { aVal = a.isActive ? 1 : 0; bVal = b.isActive ? 1 : 0; }
            else if (sortConfig.key === 'subjects') { aVal = a.assignedSubjects?.length || 0; bVal = b.assignedSubjects?.length || 0; }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    return (
        <AdminLayout title="Faculty Management">
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

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.15rem' }}>Faculty Management</h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Create faculty accounts and assign subjects. Faculty can login immediately.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={fetchFaculty} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiRefreshCw size={14} /> Refresh
                    </button>
                    <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiPlus size={15} /> Add Faculty
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ background: '#fff', padding: '0.875rem 1.125rem', borderRadius: 10, border: '1px solid var(--clr-border)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiSearch size={16} style={{ color: 'var(--clr-text-3)' }} />
                <input
                    type="text"
                    placeholder="Search faculty by name, email, or department…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.875rem', background: 'transparent', color: 'var(--clr-text)' }}
                />
                {search && <FiX style={{ cursor: 'pointer', color: 'var(--clr-text-3)' }} onClick={() => setSearch('')} />}
            </div>

            {/* Faculty Table */}
            {loading ? (
                <div className="loading-state"><div className="spinner" /><span>Loading…</span></div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('facultyId')} style={{ cursor: 'pointer' }}>
                                    Faculty ID {sortConfig.key === 'facultyId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Email</th>
                                <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>
                                    Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('subjects')} style={{ cursor: 'pointer' }}>
                                    Subjects {sortConfig.key === 'subjects' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSorted.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--clr-text-3)' }}>
                                        {search ? 'No faculty match your search.' : 'No faculty accounts yet. Click "Add Faculty" to create one.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSorted.map(f => (
                                    <tr key={f._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                                                    {f.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{f.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem' }}>{f.facultyId || '—'}</td>
                                        <td style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <FiMail size={12} /> {f.email}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.875rem' }}>{f.department?.name || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                                {(f.assignedSubjects || []).slice(0, 3).map(s => (
                                                    <span key={s._id} className="subject-code" style={{ fontSize: '0.7rem' }}>
                                                        {s.subjectCode}
                                                    </span>
                                                ))}
                                                {(f.assignedSubjects || []).length > 3 && (
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-3)' }}>+{f.assignedSubjects.length - 3} more</span>
                                                )}
                                                {!f.assignedSubjects?.length && <span style={{ color: 'var(--clr-text-3)', fontSize: '0.82rem' }}>None</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${f.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                {f.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-ghost" style={{ padding: '0.35rem 0.625rem', fontSize: '0.8rem' }} onClick={() => openEdit(f)}>
                                                    <FiEdit2 size={13} /> Edit
                                                </button>
                                                <button className="btn btn-danger" style={{ padding: '0.35rem 0.625rem', fontSize: '0.8rem' }} onClick={() => setDeleteConfirm(f)}>
                                                    <FiTrash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', background: '#fff', padding: '1rem', borderRadius: 10, border: '1px solid var(--clr-border)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--clr-text-2)' }}>
                        Showing <strong>{faculty.length}</strong> of <strong>{totalItems}</strong> faculties
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

            {/* Modal: Create / Edit */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem' }}>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</h3>
                            <button className="btn btn-ghost" style={{ padding: '0.3rem' }} onClick={() => setModalOpen(false)}>
                                <FiX size={18} />
                            </button>
                        </div>

                        {formError && (
                            <div style={{ background: 'var(--clr-danger-lt)', border: '1px solid var(--clr-danger-lt)', borderRadius: 8, padding: '0.625rem 0.875rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--clr-danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <FiAlertCircle size={14} /> {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="input-group">
                                <label><FiUser size={12} style={{ marginRight: 4 }} /> Full Name</label>
                                <input type="text" name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. Dr. Jane Smith" required />
                            </div>
                            <div className="input-group">
                                <label>Faculty ID</label>
                                <input type="text" name="facultyId" value={form.facultyId} onChange={handleFormChange} placeholder="e.g. FAC1023" />
                            </div>
                            <div className="input-group">
                                <label><FiMail size={12} style={{ marginRight: 4 }} /> Email</label>
                                <input type="email" name="email" value={form.email} onChange={handleFormChange} placeholder="e.g. drsmith@example.com" required />
                            </div>
                            <div className="input-group">
                                <label>Password {editingFaculty && <span style={{ color: 'var(--clr-text-3)', fontWeight: 400 }}>(leave blank to keep current)</span>}</label>
                                <input type="password" name="password" value={form.password} onChange={handleFormChange} placeholder={editingFaculty ? 'Leave blank to keep current' : 'Temporary password'} />
                            </div>
                            <div className="input-group">
                                <label>Department</label>
                                <select name="department" value={form.department} onChange={handleFormChange} required>
                                    <option value="">Select department…</option>
                                    {departments.map(d => (
                                        <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                                    ))}
                                </select>
                            </div>

                            {subjects.length > 0 && (
                                <div className="input-group">
                                    <label><FiBook size={12} style={{ marginRight: 4 }} /> Assigned Subjects</label>
                                    <div style={{ border: '1px solid var(--clr-border-2)', borderRadius: 8, padding: '0.75rem', maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {subjects.map(s => (
                                            <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                                <input
                                                    type="checkbox"
                                                    name="assignedSubjects"
                                                    value={s._id}
                                                    checked={form.assignedSubjects.includes(s._id)}
                                                    onChange={handleFormChange}
                                                />
                                                <span style={{ fontWeight: 600 }}>{s.subjectCode}</span>
                                                <span style={{ color: 'var(--clr-text-2)' }}>{s.name}</span>
                                                <span style={{ color: 'var(--clr-text-3)', fontSize: '0.78rem', marginLeft: 'auto' }}>Sem {s.semester}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {form.department && subjects.length === 0 && (
                                <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-3)' }}>
                                    No subjects found for this department. Add subjects first.
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Saving…' : editingFaculty ? 'Save Changes' : 'Create Faculty Account'}
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
                        <h3 style={{ marginBottom: '0.75rem' }}>Delete Faculty?</h3>
                        <p style={{ color: 'var(--clr-text-2)', marginBottom: '1.5rem' }}>
                            Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>
                                <FiTrash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default FacultyManagement;
