import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiAlertTriangle, FiEye, FiEyeOff, FiLoader, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { CampusLensIcon } from '../components/CollegePulseLogo';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const StudentRegister = () => {
    const { registerStudent, loading } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        rollNumber: '', department: '', semester: '', residenceType: ''
    });
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loadingDepts, setLoadingDepts] = useState(true);

    useEffect(() => {
        api.get('/departments')
            .then(res => setDepartments(res.data.data || []))
            .catch(() => setDepartments([]))
            .finally(() => setLoadingDepts(false));
    }, []);

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validations
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (!form.department) {
            setError('Please select your department');
            return;
        }
        if (!form.semester) {
            setError('Please select your semester');
            return;
        }
        if (!form.residenceType) {
            setError('Please select your residence type');
            return;
        }

        const result = await registerStudent({
            name: form.name,
            email: form.email,
            password: form.password,
            rollNumber: form.rollNumber,
            department: form.department,
            semester: Number(form.semester),
            residenceType: form.residenceType,
            role: 'student',
        });

        if (!result.success) {
            setError(result.message);
            return;
        }
        navigate('/student/home', { replace: true });
    };

    return (
        <div className="login-page">
            <div className="login-card" style={{ maxWidth: '480px' }}>
                {/* Header */}
                <div className="login-header-new">
                    <div className="login-logo-wrap">
                        <CampusLensIcon size={48} color="var(--clr-primary)" />
                    </div>
                    <h1 className="login-app-name">CampusLens</h1>
                    <div className="login-role-badge student">
                        STUDENT REGISTRATION
                    </div>
                </div>

                <div style={{
                    background: 'var(--clr-primary-lt)',
                    border: '1px solid var(--clr-border)',
                    borderRadius: '0.625rem',
                    padding: '0.625rem 1rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.8125rem',
                    color: 'var(--clr-primary)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                    <FiMail size={13} style={{ flexShrink: 0 }} /> Please use your institutional or registered email
                </div>

                <form className="login-form" onSubmit={handleSubmit} id="student-register-form">
                    {error && (
                        <div className="login-error" id="register-error">
                            <FiAlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
                        </div>
                    )}

                    {/* Name */}
                    <div className="input-group">
                        <label>Full Name</label>
                        <input
                            id="reg-name"
                            type="text"
                            value={form.name}
                            onChange={set('name')}
                            placeholder="Ananya Sharma"
                            required
                            minLength={2}
                        />
                    </div>

                    {/* Email */}
                    <div className="input-group">
                        <label>College Email</label>
                        <input
                            id="reg-email"
                            type="email"
                            value={form.email}
                            onChange={set('email')}
                            placeholder="ananya@bitsathy.in"
                            required
                        />
                    </div>

                    {/* Roll Number */}
                    <div className="input-group">
                        <label>Roll Number</label>
                        <input
                            id="reg-rollnumber"
                            type="text"
                            value={form.rollNumber}
                            onChange={set('rollNumber')}
                            placeholder="e.g. 22CS101"
                            required
                        />
                    </div>

                    {/* Department + Semester in a row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Department</label>
                            <select
                                id="reg-department"
                                value={form.department}
                                onChange={set('department')}
                                required
                                disabled={loadingDepts}
                            >
                                <option value="">{loadingDepts ? 'Loading…' : 'Select dept.'}</option>
                                {departments.map(d => (
                                    <option key={d._id} value={d._id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Semester</label>
                            <select
                                id="reg-semester"
                                value={form.semester}
                                onChange={set('semester')}
                                required
                            >
                                <option value="">Sem</option>
                                {SEMESTERS.map(s => (
                                    <option key={s} value={s}>Sem {s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Residence Type */}
                    <div className="input-group">
                        <label>Residence Type</label>
                        <select
                            id="reg-residence"
                            value={form.residenceType}
                            onChange={set('residenceType')}
                            required
                        >
                            <option value="">Select Residence Type</option>
                            <option value="dayscholar">Day Scholar</option>
                            <option value="hosteller">Hosteller</option>
                        </select>
                    </div>

                    {/* Password */}
                    <div className="input-group">
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="reg-password"
                                type={showPass ? 'text' : 'password'}
                                value={form.password}
                                onChange={set('password')}
                                placeholder="Min 6 characters"
                                required
                                minLength={6}
                                style={{ paddingRight: '3rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(v => !v)}
                                style={{
                                    position: 'absolute', right: '0.75rem', top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', cursor: 'pointer', fontSize: '1rem',
                                    color: 'var(--clr-text-3)',
                                }}
                                tabIndex={-1}
                            >
                                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="input-group">
                        <label>Confirm Password</label>
                        <input
                            id="reg-confirm-password"
                            type="password"
                            value={form.confirmPassword}
                            onChange={set('confirmPassword')}
                            placeholder="Re-enter password"
                            required
                        />
                        {form.confirmPassword && form.password !== form.confirmPassword && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <FiAlertTriangle size={11} /> Passwords do not match
                            </span>
                        )}
                    </div>

                    <button
                        id="register-btn"
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                        style={{ marginTop: '0.25rem' }}
                    >
                        {loading
                            ? <><FiLoader size={14} style={{ marginRight: '0.4rem' }} />Creating Account...</>
                            : <><FiCheck size={14} style={{ marginRight: '0.4rem' }} />Create Account</>
                        }
                    </button>
                </form>

                <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--clr-text-3)' }}>
                    Already have an account?{' '}
                    <Link to="/login" id="back-to-login-link" style={{ color: 'var(--clr-primary)', fontWeight: 600, textDecoration: 'none' }}>
                        Sign In →
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default StudentRegister;
