import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiShield, FiBook, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { CampusLensIcon } from './CollegePulseLogo';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('admin');
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const placeholders = {
        admin: { email: 'admin@bitsathy.in', hint: 'Admin Portal' },
        student: { email: 'ananya@student.edu', hint: 'Student Portal' },
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(form.email, form.password);
        if (!result.success) {
            setError(result.message);
            return;
        }
        const from = location.state?.from?.pathname;
        if (result.role === 'admin') {
            navigate(from || '/admin/dashboard', { replace: true });
        } else {
            navigate(from || '/student/home', { replace: true });
        }
    };

    return (
        <div className="login-page" style={{ background: 'var(--clr-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="login-card" style={{ background: 'var(--clr-surface)', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '440px', border: '1px solid var(--clr-border)' }}>
                {/* Header */}
                <div className="login-header-new" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div className="login-logo-wrap" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
                        <CampusLensIcon size={56} color="var(--clr-primary)" />
                    </div>
                    <h1 className="login-app-name" style={{ color: 'var(--clr-text)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>CampusLens</h1>
                    <div className="login-role-badge" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', letterSpacing: '0.15em' }}>
                        ANALYTICS PORTAL
                    </div>
                </div>

                {/* Role Tabs */}
                <div className="login-tabs" style={{ display: 'flex', background: 'rgba(104, 93, 84, 0.05)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', marginBottom: '2rem' }}>
                    {['admin', 'student'].map(tab => (
                        <button
                            key={tab}
                            id={`tab-${tab}`}
                            className={`login-tab${activeTab === tab ? ' active' : ''}`}
                            style={{ 
                                flex: 1, padding: '0.75rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, transition: 'var(--trans)',
                                background: activeTab === tab ? 'var(--clr-primary)' : 'transparent',
                                color: activeTab === tab ? 'var(--clr-surface)' : 'var(--clr-text-3)'
                            }}
                            onClick={() => { setActiveTab(tab); setError(''); setForm({ email: '', password: '' }); }}
                        >
                            {tab === 'admin'
                                ? <><FiShield size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />Admin</>
                                : <><FiBook size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />Student</>
                            }
                        </button>
                    ))}
                </div>

                <form className="login-form" onSubmit={handleSubmit} id="login-form">
                    {error && (
                        <div className="login-error" style={{ background: 'rgba(211, 47, 47, 0.05)', color: 'var(--clr-danger)', padding: '0.85rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(211, 47, 47, 0.1)' }}>
                            <FiAlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
                        </div>
                    )}

                    <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Email</label>
                        <input
                            id="email-input"
                            type="email"
                            value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="Enter your email"
                            required
                            autoComplete="email"
                            style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '4px', border: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)', color: 'var(--clr-text)', fontSize: '0.9rem' }}
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--clr-text-3)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Password</label>
                        <input
                            id="password-input"
                            type="password"
                            value={form.password}
                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                            style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '4px', border: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)', color: 'var(--clr-text)', fontSize: '0.9rem' }}
                        />
                    </div>

                    <button
                        id="login-btn"
                        type="submit"
                        className="btn-login-secure"
                        disabled={loading}
                        style={{ width: '100%', height: '54px' }}
                    >
                        {loading
                            ? <><FiLoader size={18} className="spinner" /> Signing in...</>
                            : 'Sign In'
                        }
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
