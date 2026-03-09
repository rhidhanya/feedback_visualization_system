import React, { useState, useEffect, useCallback } from 'react';
import { FiUserPlus, FiEdit2, FiTrash2, FiX, FiInbox } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

const DOMAIN_OPTIONS = ['transport', 'mess', 'hostel', 'sanitation'];

const DomainHeadManagement = () => {
    const [heads, setHeads] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', assignedDomain: '', department: '', contact: '' });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

    const fetchHeads = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, deptsRes] = await Promise.all([
                api.get('/users?role=domain_head'),
                api.get('/departments')
            ]);
            setHeads(usersRes.data.data || []);
            setDepartments(deptsRes.data.data || []);
        } catch { showToast('error', 'Failed to load domain heads'); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchHeads(); }, [fetchHeads]);

    const openAdd = () => { setEditing(null); setForm({ name: '', email: '', password: '', assignedDomain: '', department: '', contact: '' }); setFormError(''); setModalOpen(true); };
    const openEdit = (h) => { setEditing(h); setForm({ name: h.name, email: h.email, password: '', assignedDomain: h.assignedDomain || '', department: h.department?._id || h.department || '', contact: h.contact || '' }); setFormError(''); setModalOpen(true); };

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
                department: form.department,
                contact: form.contact
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.15rem' }}>Domain Heads</h2>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Manage domain head accounts and assignments</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd} style={{ background: 'var(--clr-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiUserPlus size={14} /> Add Domain Head
                </button>
            </div>

            <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead><tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Department</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Contact</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Domain</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                    </tr></thead>
                    <tbody>
                        {heads.length === 0 ? (
                            <tr><td colSpan={4}><div className="empty-state" style={{ padding: '2rem' }}><FiInbox size={24} /><span>No domain heads yet</span></div></td></tr>
                        ) : heads.map(h => (
                            <tr key={h._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{h.name}</td>
                                <td style={{ padding: '10px' }}>{h.department?.name || '—'}</td>
                                <td style={{ padding: '10px' }}>{h.contact || '—'}</td>
                                <td style={{ padding: '10px' }}>{h.email}</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{ background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)', padding: '2px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>
                                        {h.assignedDomain?.charAt(0).toUpperCase() + h.assignedDomain?.slice(1)}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                    <button onClick={() => openEdit(h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary)', marginRight: 8 }}><FiEdit2 size={14} /></button>
                                    <button onClick={() => setDeleteConfirm(h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-danger)' }}><FiTrash2 size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
                            <div className="input-group">
                                <label>Department</label>
                                <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                                    <option value="">Select department…</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                                </select>
                            </div>
                            <div className="input-group"><label>Contact</label><input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="Optional contact info" /></div>
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
