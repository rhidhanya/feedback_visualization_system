import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import {
    FiPlus, FiEdit2, FiTrash2, FiUser, FiMail,
    FiSearch, FiX, FiAlertCircle, FiRefreshCw, FiUsers, FiCheckCircle, FiShield
} from 'react-icons/fi';

const HodManagement = () => {
    const [hods, setHods] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingHod, setEditingHod] = useState(null);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const [form, setForm] = useState({
        name: '', email: '', password: '', department: '', hodId: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState({ department: '', isActive: '' });

    const fetchHods = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                search: search
            });
            if (filters.department) params.append('department', filters.department);
            if (filters.isActive !== '') params.append('isActive', filters.isActive);

            const [hodRes, deptRes] = await Promise.all([
                api.get(`/admin/hod?${params.toString()}`),
                api.get('/departments'),
            ]);
            setHods(hodRes.data.data || []);
            setTotalPages(hodRes.data.pages || 1);
            setTotalItems(hodRes.data.total || 0);
            setDepartments(deptRes.data.data || []);
        } catch (err) {
            showToast('error', 'Failed to load HOD data');
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, filters]);

    useEffect(() => { fetchHods(); }, [fetchHods]);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const openCreate = () => {
        setEditingHod(null);
        setForm({ name: '', email: '', password: '', department: '', hodId: '' });
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (h) => {
        setEditingHod(h);
        setForm({
            name: h.name,
            email: h.email,
            password: '',
            department: h.department?._id || h.department || '',
            hodId: h.hodId || '',
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.name || !form.email || !form.department) {
            setFormError('Name, email, and department are required.');
            return;
        }
        if (!editingHod && !form.password) {
            setFormError('Password is required when creating an HOD account.');
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                department: form.department,
                hodId: form.hodId,
            };
            if (form.password) payload.password = form.password;

            if (editingHod) {
                await api.put(`/admin/hod/${editingHod._id}`, payload);
                showToast('success', 'HOD updated successfully');
            } else {
                await api.post('/admin/hod', payload);
                showToast('success', 'HOD account created successfully');
            }
            setModalOpen(false);
            fetchHods();
        } catch (err) {
            setFormError(err.response?.data?.message || 'An error occurred. Try again.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/admin/hod/${id}`);
            setDeleteConfirm(null);
            showToast('success', 'HOD deleted');
            fetchHods();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to delete HOD');
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedHods = [...hods].sort((a, b) => {
        let aVal, bVal;
        if (sortConfig.key === 'name') { aVal = (a.name || '').toLowerCase(); bVal = (b.name || '').toLowerCase(); }
        else if (sortConfig.key === 'department') { aVal = (a.department?.name || '').toLowerCase(); bVal = (b.department?.name || '').toLowerCase(); }
        else if (sortConfig.key === 'hodId') { aVal = (a.hodId || '').toLowerCase(); bVal = (b.hodId || '').toLowerCase(); }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <AdminLayout title="HOD Management">
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--clr-text)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>HOD Management</h2>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={fetchHods}>
                        <FiRefreshCw size={16} />
                    </button>
                    <button className="btn btn-primary" onClick={openCreate}>
                        <FiPlus size={16} /> Add New HOD
                    </button>
                </div>
            </div>

            <div className="admin-kpi-grid" style={{ minHeight: '95px' }}>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiUsers size={22} /></div>
                    <div className="info">
                        <span className="label">Total HODs</span>
                        <span className="value">{totalItems}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiUser size={22} /></div>
                    <div className="info">
                        <span className="label">Departments</span>
                        <span className="value">{departments.length}</span>
                    </div>
                </div>
                <div className="admin-kpi-card">
                    <div className="icon-box"><FiCheckCircle size={22} /></div>
                    <div className="info">
                        <span className="label">Active Access</span>
                        <span className="value">{hods.filter(h => h.isActive).length}</span>
                    </div>
                </div>

            </div>

            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1100, background: toast.type === 'success' ? 'var(--clr-success)' : 'var(--clr-danger)', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                    {toast.msg}
                </div>
            )}

            <div className="filter-bar card-premium" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', background: 'var(--clr-surface)', position: 'relative', zIndex: 10 }}>
                <div className="input-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Department</label>
                    <select
                        style={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', padding: '0.65rem', width: '100%', color: 'var(--clr-text)' }}
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
                        style={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', padding: '0.65rem', width: '100%', color: 'var(--clr-text)' }}
                        value={filters.isActive}
                        onChange={e => { setFilters(p => ({ ...p, isActive: e.target.value })); setCurrentPage(1); }}
                    >
                        <option value="">All Status</option>
                        <option value="true">Active Only</option>
                        <option value="false">Inactive Only</option>
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0, flex: 2 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Search Authorization</label>
                    <div style={{ position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} size={16} />
                        <input
                            type="text"
                            placeholder="Search by Name, Email or HOD ID..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                            style={{ paddingLeft: '2.75rem', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: '4px', width: '100%', color: 'var(--clr-charcoal)', padding: '0.65rem 0.65rem 0.65rem 2.75rem' }}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
            ) : hods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--clr-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                    <FiUser size={48} style={{ color: 'var(--clr-text-3)', marginBottom: '1.25rem' }} />
                    <h3 style={{ color: 'var(--clr-text)', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '0.05em' }}>No results match the current filters</h3>
                </div>
            ) : (
                <>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                    <th onClick={() => handleSort('hodId')} style={{ cursor: 'pointer' }}>HOD ID {sortConfig.key === 'hodId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                    <th>Email</th>
                                    <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedHods.map(h => (
                                    <tr key={h._id}>
                                        <td style={{ fontWeight: 700 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                                                    {h.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                {h.name}
                                            </div>
                                        </td>
                                        <td>{h.hodId || '—'}</td>
                                        <td>{h.email}</td>
                                        <td>
                                            {h.department ? <span className="dept-tag">{h.department.code}</span> : '—'}
                                        </td>
                                        <td>
                                            <span className={`badge ${h.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                <span className="badge-dot">●</span> {h.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await api.patch(`/users/${h._id}/toggle-status`);
                                                            showToast('success', `${h.name} status updated`);
                                                            fetchHods();
                                                        } catch (err) { showToast('error', 'Failed to update status'); }
                                                    }}
                                                    className={h.isActive ? 'btn-deactivate' : 'btn-activate'}
                                                >
                                                    {h.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button onClick={() => openEdit(h)} style={{ color: 'var(--clr-text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} title="Edit"><FiEdit2 size={16} /></button>
                                                <button onClick={() => setDeleteConfirm(h)} style={{ color: 'var(--clr-danger)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} title="Delete"><FiTrash2 size={16} /></button>
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
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                disabled={currentPage === 1}
                            >
                                ← Previous
                            </button>
                            
                            {[...Array(totalPages)].map((_, i) => {
                                const pageNum = i + 1;
                                if (totalPages > 7) {
                                    if (pageNum !== 1 && pageNum !== totalPages && (pageNum < currentPage - 1 || pageNum > currentPage + 1)) {
                                        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} style={{ color: 'var(--clr-text-3)' }}>...</span>;
                                        return null;
                                    }
                                }
                                return (
                                    <button 
                                        key={pageNum}
                                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button 
                                className="pagination-btn pagination-nav-btn" 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                disabled={currentPage === totalPages}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal: Create / Edit */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem' }}>{editingHod ? 'Edit HOD' : 'Add New HOD'}</h3>
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
                                <label><FiUser size={12} style={{ marginRight: 4 }} /> HOD Name</label>
                                <input type="text" name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. Dr. Robert Wilson" required />
                            </div>
                            <div className="input-group">
                                <label>HOD ID (Unique)</label>
                                <input type="text" name="hodId" value={form.hodId} onChange={handleFormChange} placeholder="e.g. HOD_CSE_01" required />
                            </div>
                            <div className="input-group">
                                <label><FiMail size={12} style={{ marginRight: 4 }} /> Email</label>
                                <input type="email" name="email" value={form.email} onChange={handleFormChange} placeholder="e.g. hodece@bitsathy.in" required />
                            </div>
                            <div className="input-group">
                                <label>Password {editingHod && <span style={{ color: 'var(--clr-text-3)', fontWeight: 400 }}>(leave blank to keep current)</span>}</label>
                                <input type="password" name="password" value={form.password} onChange={handleFormChange} placeholder={editingHod ? 'Leave blank to keep current' : 'Temporary password'} />
                            </div>
                            <div className="input-group">
                                <label>Department (Unique HOD per Dept)</label>
                                <select name="department" value={form.department} onChange={handleFormChange} required>
                                    <option value="">Select department…</option>
                                    {departments.map(d => (
                                        <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Saving…' : editingHod ? 'Save Changes' : 'Create HOD Account'}
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
                        <h3 style={{ marginBottom: '0.75rem' }}>Delete HOD?</h3>
                        <p style={{ color: 'var(--clr-text-2)', marginBottom: '1.5rem' }}>
                            Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This will remove their admin access.
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

export default HodManagement;
