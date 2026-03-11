import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiShield, FiMail, FiLock, FiEye, FiEyeOff, FiLoader, FiAlertTriangle
} from 'react-icons/fi';
import { CampusLensIcon } from '../components/CollegePulseLogo';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
    const { adminLogin, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const handleChange = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        let emailToSubmit = form.email.trim();
        if (emailToSubmit && !emailToSubmit.includes('@')) {
            emailToSubmit += '@bitsathy.in';
        }
        
        const result = await adminLogin(emailToSubmit, form.password);
        if (!result.success) {
            setError(result.message);
            return;
        }
        navigate('/admin/domain-overview', { replace: true });
    };

    return (
        <div className="login-page-premium">
            <div className="login-card-premium">
                {/* Header */}
                <div className="login-header-new">
                    <div className="login-logo-wrap">
                        <CampusLensIcon size={48} color="var(--clr-primary)" />
                    </div>
                    <h1 className="login-app-name" style={{ color: 'var(--clr-text)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>CampusLens</h1>
                    <div className="login-role-badge admin" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        ADMIN ACCESS
                    </div>
                </div>

                {/* Form */}
                <form className="login-form-premium" onSubmit={handleSubmit} id="admin-login-form">
                    {error && (
                        <div className="login-error-premium" id="login-error">
                            <FiAlertTriangle size={14} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label className="login-label-premium" htmlFor="admin-email-input">Email Address</label>
                        <div className="input-icon-wrap">
                            <span className="input-icon"><FiMail size={15} /></span>
                            <input
                                id="admin-email-input"
                                value={form.email}
                                onChange={handleChange('email')}
                                placeholder="admin@bitsathy.in (or just admin)"
                                required
                                autoComplete="email"
                                type="text"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="login-label-premium" htmlFor="admin-password-input">Password</label>
                        <div className="input-icon-wrap">
                            <span className="input-icon"><FiLock size={15} /></span>
                            <input
                                id="admin-password-input"
                                type={showPass ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange('password')}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                                className="has-right-icon"
                            />
                            <button
                                type="button"
                                className="input-icon-right"
                                onClick={() => setShowPass(v => !v)}
                                tabIndex={-1}
                                aria-label="Toggle password visibility"
                            >
                                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        id="admin-login-btn"
                        type="submit"
                        className="btn-login-secure"
                        disabled={loading}
                        style={{ width: '100%', height: '54px' }}
                    >
                        {loading
                            ? <><FiLoader size={18} className="spinner" /> Signing in...</>
                            : <>Log In Securely</>
                        }
                    </button>
                </form>

                <p className="login-admin-only-note">
                    Admin access only. Students & Faculty: <a href="/login">User Login</a>
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
