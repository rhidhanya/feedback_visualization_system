import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiUserPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiRefreshCw, FiShield, FiCheckCircle } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import useDebounce from '../../utils/useDebounce';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ role: '', isActive: '' });
    const [actionMsg, setActionMsg] = useState(null);
    const limit = 10;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'faculty', isActive: true });
    const [, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);

    const showToast = (ok, text) => { setActionMsg({ ok, text }); setTimeout(() => setActionMsg(null), 3500); };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit });
            if (filters.role) params.set('role', filters.role);
            if (filters.isActive !== '') params.set('isActive', filters.isActive);
            if (debouncedSearch) params.set('search', debouncedSearch);

            const res = await api.get(`/users?${params}`);
            setUsers(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error(err);
            showToast(false, 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, [page, filters, debouncedSearch]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', email: '', password: '', role: 'faculty', isActive: true });
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (u) => {
        setEditing(u);
        setForm({
            name: u.name,
            email: u.email,
            password: '',
            role: u.role,
            isActive: u.isActive
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.name || !form.email || !form.role) {
            setFormError('Name, email, and role are required');
            return;
        }
        if (!editing && !form.password) {
            setFormError('Password required for new users');
            return;
        }

        setFormLoading(true);
        try {
            if (editing) {
                await api.put(`/users/${editing._id}`, form);
                showToast(true, 'User updated successfully');
            } else {
                // Determine creation endpoint based on role if special logic exists
                // but for general CRUD we can use a generic endpoint if available
                // Based on userController.js, we have separate for student/faculty/domain_head
                let endpoint = '/users';
                if (form.role === 'student') endpoint = '/users/student';
                else if (form.role === 'faculty') endpoint = '/users/faculty';
                else if (form.role === 'domain_head') endpoint = '/users/domain-head';

                await api.post(endpoint, form);
                showToast(true, 'User created successfully');
            }
            setModalOpen(false);
            fetchUsers();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Error saving user');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            setDeleteConfirm(null);
            showToast(true, 'User deleted');
            fetchUsers();
        } catch (err) {
            showToast(false, err.response?.data?.message || 'Delete failed');
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <AdminLayout title="User Management">
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--clr-text)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>User Management</h2>

                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={fetchUsers} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiRefreshCw size={14} />
                    </button>
                    <button className="btn btn-primary" onClick={openAdd} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiUserPlus size={18} /> Add New User
                    </button>
                </div>
            </div>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiUsers size={22} /></div>
                    <div className="info">
                        <span className="label">Total System Users</span>
                        <span className="value">{total}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#10b981' }}><FiCheckCircle size={22} /></div>
                    <div className="info">
                        <span className="label">Active Accounts</span>
                        <span className="value">{users.filter(u => u.isActive).length}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}><FiShield size={22} /></div>
                    <div className="info">
                        <span className="label">Admin Roles</span>
                        <span className="value">{users.filter(u => u.role === 'admin').length}</span>
                    </div>
                </div>
            </div>

            <div className="filter-bar card-premium" style={{ marginBottom: '2rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-end', background: 'var(--clr-surface)' }}>
                <div className="input-group" style={{ margin: 0, flex: 2 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Search Directory</label>
                    <div style={{ position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} size={16} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            style={{ paddingLeft: '2.75rem', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', width: '100%', color: 'var(--clr-text)', padding: '0.65rem 0.65rem 0.65rem 2.75rem' }}
                        />
                    </div>
                </div>
                <div className="input-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Role Filter</label>
                    <select
                        style={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', padding: '0.65rem', width: '100%', color: 'var(--clr-text)' }}
                        value={filters.role}
                        onChange={e => { setFilters(p => ({ ...p, role: e.target.value })); setPage(1); }}
                    >
                        <option value="">All Roles</option>
                        <option value="principal">Principal</option>
                        <option value="dean">Dean</option>
                        <option value="admin">Administrator</option>
                        <option value="hod">HOD</option>
                        <option value="faculty">Faculty</option>
                        <option value="domain_head">Incharge</option>
                        <option value="student">Student</option>
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
                        <option value="true">Active Only</option>
                        <option value="false">Inactive Only</option>
                    </select>
                </div>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>User Basics</th>
                            <th>Designation</th>
                            <th>Status</th>
                            <th>Joined Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id}>
                                <td style={{ fontWeight: 700 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                                            {u.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--clr-text)' }}>{u.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)', fontWeight: 500 }}>{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`dept-tag role-${u.role}`} style={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', textTransform: 'capitalize' }}>
                                        {u.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                                        <span className="badge-dot">●</span> {u.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)', fontWeight: 600 }}>
                                    {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <button onClick={() => openEdit(u)} style={{ color: 'var(--clr-text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} title="Edit Settings"><FiEdit2 size={16} /></button>
                                        <button onClick={() => setDeleteConfirm(u)} style={{ color: 'var(--clr-danger)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} title="Remove Account"><FiTrash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination ... similar to StudentsPage */}
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
                        // Sliding window logic for many pages
                        if (totalPages > 7) {
                            if (pageNum !== 1 && pageNum !== totalPages && (pageNum < page - 1 || pageNum > page + 1)) {
                                // Show "..." at positions 2 and totalPages-1 if they are outside the window
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

            {/* Modal & Toast elements (Styles expected in global CSS) */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content-premium">
                        <div className="modal-header">
                            <h3>{editing ? 'Edit User' : 'Register New User'}</h3>
                            <button onClick={() => setModalOpen(false)} className="close-btn"><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="premium-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Access Role</label>
                                    <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} required>
                                        <option value="faculty">Faculty</option>
                                        <option value="hod">HOD</option>
                                        <option value="principal">Principal</option>
                                        <option value="dean">Dean</option>
                                        <option value="domain_head">Incharge</option>
                                        <option value="admin">Administrator</option>
                                        <option value="student">Student</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Initial Password {editing && '(leave blank)'}</label>
                                    <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Processing...' : editing ? 'Save Changes' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-confirm card-premium">
                        <FiTrash2 size={40} color="var(--clr-danger)" style={{ marginBottom: '1rem' }} />
                        <h3>Delete User?</h3>
                        <p>Are you sure you want to remove <strong>{deleteConfirm.name}</strong>? This will permanentely revoke their access.</p>
                        <div className="confirm-actions">
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost">No, Keep</button>
                            <button onClick={() => handleDelete(deleteConfirm._id)} className="btn btn-danger">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {actionMsg && (
                <div className={`toast ${actionMsg.ok ? 'success' : 'error'}`}>
                    {actionMsg.text}
                </div>
            )}
        </AdminLayout>
    );
};

export default UsersPage;
