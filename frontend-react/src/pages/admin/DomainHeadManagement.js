import React, { useState, useEffect, useCallback } from 'react';
import { FiUserPlus, FiEdit2, FiTrash2, FiX, FiInbox, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

const DOMAIN_OPTIONS = ['transport', 'mess', 'hostel', 'sanitation'];

const DomainHeadManagement = () => {
    const navigate = useNavigate();
    const [heads, setHeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', assignedDomain: '' });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

    const fetchHeads = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users?role=domain_head&page=${page}&limit=10`);
            setHeads(res.data.data || []);
            setTotalPages(res.data.totalPages || 1);
        } catch { showToast('error', 'Failed to load domain heads'); } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchHeads(); }, [fetchHeads]);

    const openAdd = () => { setEditing(null); setForm({ name: '', email: '', password: '', assignedDomain: '' }); setFormError(''); setModalOpen(true); };
    const openEdit = (h) => { setEditing(h); setForm({ name: h.name, email: h.email, password: '', assignedDomain: h.assignedDomain || '' }); setFormError(''); setModalOpen(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.name || !form.email || !form.assignedDomain) { setFormError('Name, email, and domain are required'); return; }
        if (!editing && !form.password) { setFormError('Password required for new accounts'); return; }

        setFormLoading(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                role: 'domain_head',
                assignedDomain: form.assignedDomain,
            };
            if (form.password) payload.password = form.password;

            if (editing) {
                await api.put(`/users/${editing._id}`, payload);
                showToast('success', 'Domain head updated');
            } else {
                await api.post('/users/domain-head', payload);
                showToast('success', 'Domain head created');
            }
            setModalOpen(false);
            fetchHeads();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Error occurred');
        } finally { setFormLoading(false); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            setDeleteConfirm(null);
            showToast('success', 'Domain head deleted');
            fetchHeads();
        } catch (err) { showToast('error', err.response?.data?.message || 'Failed to delete'); }
    };

    return (
        <AdminLayout title="Domain Head Management">
            {loading && <div className="loading-state"><div className="spinner" /><span>Loading…</span></div>}
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'success' ? 'var(--clr-accent)' : 'var(--clr-danger)', color: '#fff', padding: '12px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-lg)' }}>
                    {toast.msg}
                </div>
            )}

            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--clr-text)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Domain Head Management</h2>

                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={fetchHeads} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiRefreshCw size={14} />
                    </button>
                    <button className="btn btn-primary" onClick={openAdd} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiUserPlus size={18} /> Add Domain Head
                    </button>
                </div>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Domain</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {heads.length === 0 ? (
                            <tr><td colSpan={4}><div className="empty-state" style={{ padding: '2rem' }}><FiInbox size={24} /><span>No domain heads yet</span></div></td></tr>
                        ) : heads.map(h => (
                            <tr key={h._id}>
                                <td style={{ fontWeight: 700 }}>{h.name}</td>
                                <td>{h.email}</td>
                                <td>
                                    <span style={{ background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)', padding: '4px 12px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                                        {h.assignedDomain?.charAt(0).toUpperCase() + h.assignedDomain?.slice(1)}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                                        <button onClick={() => openEdit(h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text)', display: 'flex' }} title="Edit"><FiEdit2 size={16} /></button>
                                        <button onClick={() => setDeleteConfirm(h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4d', display: 'flex' }} title="Delete"><FiTrash2 size={16} /></button>
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
                                if (pageNum === page - 2 || pageNum === page + 2) return <span key={pageNum} style={{ color: 'var(--clr-text-3)' }}>...</span>;
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

            {/* Modal */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 480, width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>{editing ? 'Edit' : 'Add'} Domain Head</h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX size={18} /></button>
                        </div>
                        {formError && <div style={{ color: 'var(--clr-danger)', fontSize: '0.82rem', marginBottom: '0.75rem', padding: '8px 12px', background: '#fee2e2', borderRadius: 6 }}>{formError}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="input-group"><label>Name</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
                            <div className="input-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required /></div>
                            <div className="input-group"><label>Password {editing && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(leave blank to keep)</span>}</label>
                                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} {...(!editing ? { required: true } : {})} placeholder="Min 6 characters" />
                            </div>
                            <div className="input-group"><label>Assigned Domain</label>
                                <select value={form.assignedDomain} onChange={e => setForm(p => ({ ...p, assignedDomain: e.target.value }))} required>
                                    <option value="">Select domain…</option>
                                    {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={formLoading} style={{ background: 'var(--clr-primary)', marginTop: '0.5rem' }}>
                                {formLoading ? 'Saving…' : editing ? 'Update' : 'Create Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 400, textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Delete Domain Head?</h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Remove <strong>{deleteConfirm.name}</strong> ({deleteConfirm.assignedDomain})?</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn" style={{ background: '#f1f5f9' }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm._id)} className="btn" style={{ background: 'var(--clr-danger)', color: '#fff' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default DomainHeadManagement;
