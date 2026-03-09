import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    FiMail, FiLock, FiEye, FiEyeOff, FiLoader, FiAlertTriangle, FiUser
} from 'react-icons/fi';
import { CampusLensIcon } from '../components/CollegePulseLogo';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login, loading } = useAuth(); // The unified /auth/login endpoint
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

        const result = await login(emailToSubmit, form.password);
        if (!result.success) {
            setError(result.message);
            return;
        }

        // Redirect dynamically based on the logged-in role
        switch (result.role) {
            case 'student':
                navigate('/student/home', { replace: true });
                break;
            case 'hod':
                navigate('/hod/dashboard', { replace: true });
                break;
            case 'domain_head':
                navigate('/domain-head/dashboard', { replace: true });
                break;
            case 'principal':
            case 'dean':
                navigate('/principal/dashboard', { replace: true });
                break;
            case 'admin':
                navigate('/admin/dashboard', { replace: true });
                break;
            case 'faculty':
                setError('Access Denied: The Faculty Dashboard has been deprecated.');
                break;
            default:
                navigate('/unauthorized', { replace: true });
        }
    };

    return (
        <div className="login-page-premium">
            <div className="login-card-premium">
                {/* Header */}
                <div className="login-header-new">
                    <div className="login-logo-wrap">
                        <CampusLensIcon size={48} color="var(--clr-primary)" />
                    </div>
                    <h1 className="login-app-name">CampusLens</h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                        Unified Login Portal
                    </p>
                </div>

                <form className="login-form-premium" onSubmit={handleSubmit} id="unified-login-form">
                    {error && (
                        <div className="login-error-premium" id="login-error">
                            <FiAlertTriangle size={14} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="login-label-premium" htmlFor="unified-email-input">Official Email Address</label>
                        <div className="input-icon-wrap">
                            <span className="input-icon"><FiMail size={15} /></span>
                            <input
                                id="unified-email-input"
                                value={form.email}
                                onChange={handleChange('email')}
                                placeholder="name@bitsathy.in"
                                required
                                type="text"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="login-label-premium" htmlFor="unified-password-input">Password</label>
                        <div className="input-icon-wrap">
                            <span className="input-icon"><FiLock size={15} /></span>
                            <input
                                id="unified-password-input"
                                type={showPass ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange('password')}
                                placeholder="Enter your password"
                                required
                                className="has-right-icon"
                            />
                            <button
                                type="button"
                                className="input-icon-right"
                                onClick={() => setShowPass(v => !v)}
                            >
                                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        id="unified-login-btn"
                        type="submit"
                        className="btn-login-gradient"
                        disabled={loading}
                        style={{ marginTop: '1rem' }}
                    >
                        {loading ? <FiLoader size={16} className="spin" /> : 'Log In Securely'}
                    </button>
                </form>

                <div className="login-footer-links" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                        Securely connecting Students, HODs, Incharges, and Principal.
                    </div>
                    {/* Small explicit link to direct strictly to student register if needed */}
                    <Link to="/student-register" style={{ fontSize: '0.85rem', color: 'var(--clr-primary)', fontWeight: 600, textDecoration: 'none' }}>
                        New Student? Register Here
                    </Link>
                </div>
            </div>
            
            {/* Quick Helper Credentials UI Element For Development - Delete Later in Prod */}
            <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', background: 'rgba(255,255,255,0.95)', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: '0.75rem', backdropFilter: 'blur(5px)', border: '1px solid #e2e8f0', zIndex: 50, maxWidth: '280px' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}><FiUser size={12}/> Demo Credentials</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#475569' }}>
                    <div><strong>Student:</strong> name@bitsathy.in / student123</div>
                    <div><strong>HOD:</strong> hod.cse@bitsathy.in / hodcse123</div>
                    <div><strong>Principal:</strong> principal@bitsathy.in / principal123</div>
                    <div><strong>Incharge:</strong> transport@bitsathy.in / transport123</div>
                </div>
            </div>
        </div>
    );
};

export default Login;
