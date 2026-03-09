import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiUserPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

const StudentsPage = () => {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ department: '', semester: '', isActive: '' });
    const [actionMsg, setActionMsg] = useState(null);
    const limit = 30;

    // Modal & Form States
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', department: '', rollNumber: '', semester: '', year: '', section: '', residenceType: 'dayscholar' });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const showToast = (ok, text) => { setActionMsg({ ok, text }); setTimeout(() => setActionMsg(null), 3500); };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page, limit, role: 'student' });
            if (filters.department) p.set('department', filters.department);
            if (filters.semester) p.set('semester', filters.semester);
            if (filters.isActive !== '') p.set('isActive', filters.isActive);

            const [userRes, deptRes] = await Promise.all([
                api.get(`/users?${p}`),
                api.get('/departments'),
            ]);
            setUsers(userRes.data.data);
            setTotal(userRes.data.total);
            setDepartments(deptRes.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [page, filters]);

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
        setForm({ name: '', email: '', password: '', department: '', rollNumber: '', semester: '', year: '', section: '', residenceType: 'dayscholar' });
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
            year: u.year || '',
            section: u.section || '',
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
            // Re-using the generic user update / creation logic 
            // The backend doesn't have a specific `createStudent` endpoint besides auth/register, so we might need to rely on generic user creation or auth/register if an admin is creating them.
            // Wait, we need to handle creating a student. A generic POST /api/users does not exist in our userController yet? 
            // Wait, auth/register is for students. Let's use auth/register to create, and users/:id to update.
            const payload = {
                name: form.name,
                email: form.email,
                department: form.department,
                rollNumber: form.rollNumber,
                semester: form.semester,
                year: form.year,
                section: form.section,
                residenceType: form.residenceType
            };
            if (form.password) payload.password = form.password;

            if (editing) {
                await api.put(`/users/${editing._id}`, payload);
                showToast(true, 'Student updated successfully');
            } else {
                await api.post('/users/student', payload); // Admin-only endpoint (no email restriction)
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Students</h2>
                    <p>Manage student accounts — {total} students registered</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd} style={{ background: 'var(--clr-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiUserPlus size={14} /> Add Student
                </button>
            </div>

            {actionMsg && (
                <div className={`alert ${actionMsg.ok ? 'alert-success' : 'alert-error'}`} id="action-msg">
                    {actionMsg.text}
                </div>
            )}

            <div className="filter-bar" id="student-filter-bar">
                <div className="input-group">
                    <label>Department</label>
                    <select
                        id="st-filter-dept"
                        value={filters.department}
                        onChange={e => { setFilters(p => ({ ...p, department: e.target.value })); setPage(1); }}
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                    </select>
                </div>
                <div className="input-group">
                    <label>Semester</label>
                    <select
                        id="st-filter-sem"
                        value={filters.semester}
                        onChange={e => { setFilters(p => ({ ...p, semester: e.target.value })); setPage(1); }}
                    >
                        <option value="">All Semesters</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                </div>
                <div className="input-group">
                    <label>Status</label>
                    <select
                        id="st-filter-status"
                        value={filters.isActive}
                        onChange={e => { setFilters(p => ({ ...p, isActive: e.target.value })); setPage(1); }}
                    >
                        <option value="">All</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="spinner-wrap"><div className="spinner" /></div>
            ) : users.length === 0 ? (
                <div className="empty-state">
                    <FiUsers size={32} style={{ color: 'var(--clr-primary-lt)', marginBottom: '0.5rem' }} />
                    <h3>No students found</h3>
                </div>
            ) : (
                <>
                    <div className="table-wrap" id="students-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Roll No.</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th>Year</th>
                                    <th>Sec</th>
                                    <th>Sem</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                                        <td style={{ color: 'var(--clr-text-3)', fontSize: '0.8125rem' }}>{u.rollNumber}</td>
                                        <td style={{ color: 'var(--clr-text-3)', fontSize: '0.8125rem' }}>{u.email}</td>
                                        <td>
                                            {u.department ? <span className="badge badge-primary">{u.department.code}</span> : '—'}
                                        </td>
                                        <td>{u.year || '—'}</td>
                                        <td>{u.section || '—'}</td>
                                        <td>Sem {u.semester}</td>
                                        <td>
                                            <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                {u.isActive ? '● Active' : '● Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button onClick={() => toggleStatus(u._id, u.name)} className={`btn ${u.isActive ? 'btn-danger' : 'btn-success'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', minWidth: '70px' }}>
                                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button onClick={() => openEdit(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary)' }}><FiEdit2 size={14} /></button>
                                                <button onClick={() => setDeleteConfirm(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-danger)' }}><FiTrash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                            <button id="students-prev-btn" className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                            <span style={{ color: 'var(--clr-text-3)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
                            <button id="students-next-btn" className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
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
                                <label>Year</label>
                                <input value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} placeholder="e.g. 2nd Year" />
                            </div>

                            <div className="input-group">
                                <label>Section</label>
                                <input value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} placeholder="e.g. A" />
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

