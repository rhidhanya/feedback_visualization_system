import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiShield, FiEye, FiEyeOff, FiLoader, FiAlertTriangle, FiSettings } from 'react-icons/fi';
import { CampusLensIcon } from '../components/CollegePulseLogo';
import { useAuth } from '../context/AuthContext';

const InchargeLogin = () => {
    const { domainHeadLogin, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await domainHeadLogin(form.email, form.password);
        if (!result.success) { setError(result.message); return; }
        navigate('/domain-head/dashboard', { replace: true });
    };

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Header */}
                <div className="login-header-new">
                    <div className="login-logo-wrap">
                        <CampusLensIcon size={48} color="var(--clr-primary)" />
                    </div>
                    <h1 className="login-app-name">CampusLens</h1>
                    <div className="login-role-badge incharge">
                        INCHARGE ACCESS
                    </div>
                </div>

                <div style={{
                    background: 'var(--clr-primary-lt)', border: '1px solid var(--clr-border)',
                    borderRadius: '0.625rem', padding: '0.625rem 1rem', marginBottom: '1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem',
                }}>
                    <FiSettings size={14} style={{ color: 'var(--clr-primary)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--clr-primary)' }}>
                        Restricted to <strong>incharges</strong> only
                    </span>
                </div>

                <form className="login-form" onSubmit={handleSubmit} id="incharge-login-form">
                    {error && (
                        <div className="login-error" id="login-error">
                            <FiAlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email</label>
                        <input id="incharge-email-input" type="email" value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="incharge@bitsathy.in" required autoComplete="email" />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input id="incharge-password-input" type={showPass ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                placeholder="Enter password" required autoComplete="current-password"
                                style={{ paddingRight: '3rem' }} />
                            <button type="button" onClick={() => setShowPass(v => !v)}
                                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-3)', display: 'flex', alignItems: 'center' }}
                                tabIndex={-1}>
                                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button id="incharge-login-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {loading ? <><FiLoader size={15} /> Signing in...</> : <><FiShield size={15} /> Sign In</>}
                    </button>
                </form>

                <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.82rem' }}>
                    <p style={{ color: 'var(--clr-text-3)', marginBottom: '0.5rem' }}>Domain-specific portals:</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <Link to="/login/transport-incharge" style={{ color: 'var(--clr-primary)', fontWeight: 600, textDecoration: 'none' }}>Transport</Link>
                        <span style={{ color: '#94a3b8' }}>|</span>
                        <Link to="/login/mess-incharge" style={{ color: 'var(--clr-accent)', fontWeight: 600, textDecoration: 'none' }}>Mess</Link>
                        <span style={{ color: '#94a3b8' }}>|</span>
                        <Link to="/login/hostel-incharge" style={{ color: 'var(--clr-primary)', fontWeight: 600, textDecoration: 'none' }}>Hostel</Link>
                        <span style={{ color: '#94a3b8' }}>|</span>
                        <Link to="/login/sanitation-incharge" style={{ color: 'var(--clr-primary)', fontWeight: 600, textDecoration: 'none' }}>Sanitation</Link>
                    </div>
                    <p style={{ color: 'var(--clr-text-3)' }}>
                        <Link to="/login/principal" style={{ color: 'var(--clr-primary)', fontWeight: 600, textDecoration: 'none' }}>Principal</Link>
                        {' '} | {' '}
                        <Link to="/login/student" style={{ color: 'var(--clr-primary)', fontWeight: 600, textDecoration: 'none' }}>Student</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InchargeLogin;
