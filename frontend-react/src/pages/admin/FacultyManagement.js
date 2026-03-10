import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import {
    FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiBook,
    FiSearch, FiX, FiCheck, FiAlertCircle, FiRefreshCw, FiUsers, FiCheckCircle
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
        name: '', email: '', password: '', department: '', assignedSubjects: []
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState({ department: '', isActive: '' });

    const fetchFaculty = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                search: search
            });
            if (filters.department) params.append('department', filters.department);
            if (filters.isActive !== '') params.append('isActive', filters.isActive);

            const [facRes, deptRes] = await Promise.all([
                api.get(`/admin/faculty?${params.toString()}`),
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
    }, [currentPage, search, filters]);

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

    // Client-side sorting on already-fetched (and paginated) data
    const sortedFaculty = [...faculty].sort((a, b) => {
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
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--clr-text)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Faculty Management</h2>
                    <p style={{ color: 'var(--clr-text-3)', fontSize: '0.875rem' }}>Core faculty directory & subject authorization control</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={fetchFaculty}>
                        <FiRefreshCw size={16} />
                    </button>
                    <button className="btn btn-primary" onClick={openCreate}>
                        <FiPlus size={16} /> Add New Faculty
                    </button>
                </div>
            </div>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiUsers size={22} /></div>
                    <div className="info">
                        <span className="label">Total Faculty</span>
                        <span className="value">{totalItems}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiBook size={22} /></div>
                    <div className="info">
                        <span className="label">Total Departments</span>
                        <span className="value">{departments.length}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiCheckCircle size={22} /></div>
                    <div className="info">
                        <span className="label">Active Faculty</span>
                        <span className="value">{faculty.filter(f => f.isActive).length}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiAlertCircle size={22} /></div>
                    <div className="info">
                        <span className="label">Access Control</span>
                        <span className="value">Lvl 2</span>
                    </div>
                </div>
            </div>

            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1100, background: toast.type === 'success' ? 'var(--clr-success)' : 'var(--clr-danger)', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                    {toast.msg}
                </div>
            )}

            <div className="filter-bar card-premium" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', padding: '1.5rem', alignItems: 'flex-end', background: 'var(--clr-surface)' }}>
                <div className="input-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Department</label>
                    <select
                        style={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', padding: '0.65rem', width: '100%', color: 'var(--clr-text-on-oat)' }}
                        value={filters.department}
                        onChange={e => { setFilters(p => ({ ...p, department: e.target.value })); setCurrentPage(1); }}
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, flex: 0.8 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Status</label>
                    <select
                        style={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', padding: '0.65rem', width: '100%', color: 'var(--clr-text-on-oat)' }}
                        value={filters.isActive}
                        onChange={e => { setFilters(p => ({ ...p, isActive: e.target.value })); setCurrentPage(1); }}
                    >
                        <option value="">All Status</option>
                        <option value="true">Active Only</option>
                        <option value="false">Inactive Only</option>
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, flex: 2 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Search Directory</label>
                    <div style={{ position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by Name or Email..." 
                            value={search}
                            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                            style={{ paddingLeft: '2.75rem', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', width: '100%', color: 'var(--clr-text-on-oat)', padding: '0.65rem 0.65rem 0.65rem 2.75rem' }}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
            ) : faculty.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--clr-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                    <FiUser size={48} style={{ color: 'var(--clr-text-3)', marginBottom: '1.25rem' }} />
                    <h3 style={{ color: 'var(--clr-text-on-oat)', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '0.05em' }}>No faculty found matching filters</h3>
                </div>
            ) : (
                <>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                    <th>Email</th>
                                    <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                    <th>Subjects</th>
                                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedFaculty.map(f => (
                                    <tr key={f._id}>
                                        <td style={{ fontWeight: 700 }}>{f.name}</td>
                                        <td>{f.email}</td>
                                        <td>
                                            {f.department ? <span className="dept-tag">{f.department.code}</span> : '—'}
                                        </td>
                                        <td>
                                            <select 
                                                style={{ padding: '0.35rem 0.6rem', height: 'auto', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'default' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option style={{ background: 'var(--clr-sidebar)' }}>{f.assignedSubjects?.length || 0} Subjects Assigned</option>
                                                {(f.assignedSubjects || []).map(s => (
                                                    <option key={s._id} style={{ background: 'var(--clr-sidebar)' }}>{s.subjectCode} — {s.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <span className={`badge ${f.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                {f.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            await api.patch(`/users/${f._id}/toggle-status`);
                                                            showToast('success', `${f.name} status updated`);
                                                            fetchFaculty();
                                                        } catch (err) { showToast('error', 'Failed to update status'); }
                                                    }}
                                                    className={f.isActive ? 'btn-deactivate' : 'btn-activate'}
                                                >
                                                    {f.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button onClick={() => openEdit(f)} style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} title="Edit"><FiEdit2 size={16} /></button>
                                                <button onClick={() => setDeleteConfirm(f)} style={{ color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} title="Delete"><FiTrash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center', alignItems: 'center' }}>
                            <button className="btn btn-ghost" style={{ borderRadius: '10px' }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>← Previous</button>
                            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Page {currentPage} of {totalPages}</span>
                            <button className="btn btn-ghost" style={{ borderRadius: '10px' }} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next →</button>
                        </div>
                    )}
                </>
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
