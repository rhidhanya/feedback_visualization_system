import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiUserPlus, FiEdit2, FiTrash2, FiX, FiBook, FiCheckCircle, FiShield, FiSearch, FiRefreshCw } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import useDebounce from '../../utils/useDebounce';

const StudentsPage = () => {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ department: '', semester: '', isActive: '' });
    const [actionMsg, setActionMsg] = useState(null);
    const limit = 10;

    // Modal & Form States
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', department: '', rollNumber: '', semester: '', residenceType: 'dayscholar' });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const showToast = (ok, text) => { setActionMsg({ ok, text }); setTimeout(() => setActionMsg(null), 3500); };

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedUsers = [...users].sort((a, b) => {
        let aVal = (a[sortConfig.key] || '').toString().toLowerCase();
        let bVal = (b[sortConfig.key] || '').toString().toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page, limit, role: 'student' });
            if (filters.department) p.set('department', filters.department);
            if (filters.semester) p.set('semester', filters.semester);
            if (filters.isActive !== '') p.set('isActive', filters.isActive);
            if (debouncedSearch) p.set('search', debouncedSearch);

            const [userRes, deptRes] = await Promise.all([
                api.get(`/users?${p}`),
                api.get('/departments'),
            ]);
            setUsers(userRes.data.data || []);
            setTotal(userRes.data.total || 0);
            setDepartments(deptRes.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [page, filters, debouncedSearch]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const toggleStatus = async (userId, name) => {
        try {
            const res = await api.patch(`/users/${userId}/toggle-status`);
            const isActive = res.data.data.isActive;
            showToast(true, `${name} ${isActive ? 'activated' : 'deactivated'} successfully`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive } : u));
        } catch (err) {
            showToast(false, err.response?.data?.message || 'Error updating status');
        }
    };

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', email: '', password: '', department: '', rollNumber: '', semester: '', residenceType: 'dayscholar' });
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (u) => {
        setEditing(u);
        setForm({
            name: u.name,
            email: u.email,
            password: '',
            department: u.department?._id || u.department || '',
            rollNumber: u.rollNumber || '',
            semester: u.semester || '',
            residenceType: u.residenceType || 'dayscholar'
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.name || !form.email || !form.department || !form.rollNumber) {
            setFormError('Name, email, department, and roll number are required');
            return;
        }
        if (!editing && !form.password) {
            setFormError('Password required for new students');
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                department: form.department,
                rollNumber: form.rollNumber,
                semester: form.semester,
                residenceType: form.residenceType
            };
            if (form.password) payload.password = form.password;

            if (editing) {
                await api.put(`/users/${editing._id}`, payload);
                showToast(true, 'Student updated successfully');
            } else {
                await api.post('/users/student', payload);
                showToast(true, 'Student created successfully');
            }
            setModalOpen(false);
            fetchUsers();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Error occurred while saving');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            setDeleteConfirm(null);
            showToast(true, 'Student account deleted');
            fetchUsers();
        } catch (err) {
            showToast(false, err.response?.data?.message || 'Failed to delete');
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <AdminLayout title="Students">
            <div className="page-header">
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--clr-text)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Student Management</h2>

                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={fetchUsers}><FiRefreshCw size={16} /></button>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <FiUserPlus size={16} /> Add Student
                    </button>
                </div>
            </div>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiUsers size={22} /></div>
                    <div className="info">
                        <span className="label">Total Students</span>
                        <span className="value">{total}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiBook size={22} /></div>
                    <div className="info">
                        <span className="label">Departments</span>
                        <span className="value">{departments.length}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiCheckCircle size={22} /></div>
                    <div className="info">
                        <span className="label">Active Status</span>
                        <span className="value">{users.filter(u => u.isActive).length}</span>
                    </div>
                </div>
            </div>

            {actionMsg && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1100, background: actionMsg.ok ? 'var(--clr-success)' : 'var(--clr-danger)', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                    {actionMsg.text}
                </div>
            )}

            <div className="filter-bar card-premium" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', background: 'var(--clr-surface)' }}>
                <div className="input-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Department</label>
                    <select
                        style={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', padding: '0.65rem', width: '100%', color: 'var(--clr-text)' }}
                        value={filters.department}
                        onChange={e => { setFilters(p => ({ ...p, department: e.target.value })); setPage(1); }}
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, flex: 0.8 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Semester</label>
                    <select
                        style={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', padding: '0.65rem', width: '100%', color: 'var(--clr-text)' }}
                        value={filters.semester}
                        onChange={e => { setFilters(p => ({ ...p, semester: e.target.value })); setPage(1); }}
                    >
                        <option value="">All Semesters</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, flex: 0.8 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Status</label>
                    <select
                        style={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', padding: '0.65rem', width: '100%', color: 'var(--clr-text)' }}
                        value={filters.isActive}
                        onChange={e => { setFilters(p => ({ ...p, isActive: e.target.value })); setPage(1); }}
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, flex: 2 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Search Students</label>
                    <div style={{ position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} size={16} />
                        <input
                            type="text"
                            placeholder="Search by Name, Roll No..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            style={{ paddingLeft: '2.75rem', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', width: '100%', color: 'var(--clr-text)', padding: '0.65rem 0.65rem 0.65rem 2.75rem' }}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
            ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <FiUsers size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                    <h3 style={{ color: '#64748b' }}>No students found matching filters</h3>
                </div>
            ) : (
                <>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                    <th onClick={() => handleSort('rollNumber')} style={{ cursor: 'pointer' }}>Roll No. {sortConfig.key === 'rollNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th onClick={() => handleSort('semester')} style={{ cursor: 'pointer' }}>Sem {sortConfig.key === 'semester' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedUsers.map(u => (
                                    <tr key={u._id}>
                                        <td style={{ fontWeight: 700 }}>{u.name}</td>
                                        <td>{u.rollNumber}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            {u.department ? <span className="dept-tag">{u.department.code}</span> : '—'}
                                        </td>
                                        <td>Sem {u.semester}</td>
                                        <td>
                                            <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                <span className="badge-dot">●</span> {u.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => toggleStatus(u._id, u.name)}
                                                    className={u.isActive ? 'btn-deactivate' : 'btn-activate'}
                                                >
                                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button onClick={() => openEdit(u)} style={{ color: '#000000', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} title="Edit"><FiEdit2 size={16} /></button>
                                                <button onClick={() => setDeleteConfirm(u)} style={{ color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} title="Delete"><FiTrash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="pagination-btn pagination-nav-btn"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                ← Previous
                            </button>

                            {[...Array(totalPages)].map((_, i) => {
                                const pageNum = i + 1;
                                if (totalPages > 7) {
                                    if (pageNum !== 1 && pageNum !== totalPages && (pageNum < page - 1 || pageNum > page + 1)) {
                                        if (pageNum === page - 2 || pageNum === page + 2) return <span key={pageNum} style={{ padding: '0 0.5rem', color: 'var(--clr-text-3)' }}>...</span>;
                                        return null;
                                    }
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                                        onClick={() => setPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                className="pagination-btn pagination-nav-btn"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal Form */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                            <h3 style={{ margin: 0 }}>{editing ? 'Edit Student' : 'Add New Student'}</h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX size={20} /></button>
                        </div>

                        {formError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{formError}</div>}

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Full Name</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                            </div>

                            <div className="input-group">
                                <label>Email</label>
                                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                            </div>

                            <div className="input-group">
                                <label>Password {editing && <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>(leave blank to keep)</span>}</label>
                                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} {...(!editing ? { required: true } : {})} />
                            </div>

                            <div className="input-group">
                                <label>Roll Number</label>
                                <input value={form.rollNumber} onChange={e => setForm(p => ({ ...p, rollNumber: e.target.value }))} required />
                            </div>

                            <div className="input-group">
                                <label>Department</label>
                                <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} required>
                                    <option value="">Select department…</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Semester</label>
                                <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}>
                                    <option value="">Select...</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Residence Type</label>
                                <select value={form.residenceType} onChange={e => setForm(p => ({ ...p, residenceType: e.target.value }))}>
                                    <option value="dayscholar">Day Scholar</option>
                                    <option value="hosteller">Hosteller</option>
                                </select>
                            </div>

                            <div style={{ gridColumn: 'span 2', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ minWidth: '120px' }}>
                                    {formLoading ? 'Saving...' : editing ? 'Save Changes' : 'Create Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1051, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 400, textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--clr-danger)' }}>Confirm Deletion</h3>
                        <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
                            Are you sure you want to completely delete the account for <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost">Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm._id)} className="btn btn-danger">Yes, Delete Account</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default StudentsPage;

