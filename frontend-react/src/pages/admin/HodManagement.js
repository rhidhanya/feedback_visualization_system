import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';
import {
    FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiPhone,
    FiSearch, FiX, FiCheck, FiAlertCircle, FiRefreshCw
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
        name: '', email: '', password: '', department: '', hodId: '', contact: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const fetchHods = useCallback(async () => {
        try {
            setLoading(true);
            const [hodRes, deptRes] = await Promise.all([
                api.get('/admin/hod'),
                api.get('/departments'),
            ]);
            setHods(hodRes.data.data || []);
            setDepartments(deptRes.data.data || []);
        } catch (err) {
            showToast('error', 'Failed to load HOD data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchHods(); }, [fetchHods]);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const openCreate = () => {
        setEditingHod(null);
        setForm({ name: '', email: '', password: '', department: '', hodId: '', contact: '' });
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
            contact: h.contact || '',
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
                contact: form.contact,
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

    const filteredAndSorted = hods
        .filter(h =>
            h.name?.toLowerCase().includes(search.toLowerCase()) ||
            h.email?.toLowerCase().includes(search.toLowerCase()) ||
            h.department?.name?.toLowerCase().includes(search.toLowerCase()) ||
            h.hodId?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
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
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.15rem' }}>Manage HOD</h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Create HOD accounts for departments. Only one HOD per department is allowed.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={fetchHods} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiRefreshCw size={14} /> Refresh
                    </button>
                    <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiPlus size={15} /> Add HOD
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ background: '#fff', padding: '0.875rem 1.125rem', borderRadius: 10, border: '1px solid var(--clr-border)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiSearch size={16} style={{ color: 'var(--clr-text-3)' }} />
                <input
                    type="text"
                    placeholder="Search HOD by name, email, or department…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.875rem', background: 'transparent', color: 'var(--clr-text)' }}
                />
                {search && <FiX style={{ cursor: 'pointer', color: 'var(--clr-text-3)' }} onClick={() => setSearch('')} />}
            </div>

            {/* HOD Table */}
            {loading ? (
                <div className="loading-state"><div className="spinner" /><span>Loading…</span></div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                    HOD Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('hodId')} style={{ cursor: 'pointer' }}>
                                    HOD ID {sortConfig.key === 'hodId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Email</th>
                                <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>
                                    Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Phone Number</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSorted.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--clr-text-3)' }}>
                                        {search ? 'No HOD match your search.' : 'No HOD accounts yet. Click "Add HOD" to create one.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSorted.map(h => (
                                    <tr key={h._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                                                    {h.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{h.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem' }}>{h.hodId || '—'}</td>
                                        <td style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <FiMail size={12} /> {h.email}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.875rem' }}>
                                            {h.department?.name ? (
                                                <>{h.department.name} <span style={{ color: 'var(--clr-text-3)', fontSize: '0.75rem' }}>({h.department.code})</span></>
                                            ) : '—'}
                                        </td>
                                        <td style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem' }}>
                                            {h.contact ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <FiPhone size={12} /> {h.contact}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-ghost" style={{ padding: '0.35rem 0.625rem', fontSize: '0.8rem' }} onClick={() => openEdit(h)}>
                                                    <FiEdit2 size={13} /> Edit
                                                </button>
                                                <button className="btn btn-danger" style={{ padding: '0.35rem 0.625rem', fontSize: '0.8rem' }} onClick={() => setDeleteConfirm(h)}>
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
                            <div className="input-group">
                                <label><FiPhone size={12} style={{ marginRight: 4 }} /> Phone Number</label>
                                <input type="text" name="contact" value={form.contact} onChange={handleFormChange} placeholder="e.g. +91 9876543210" />
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
