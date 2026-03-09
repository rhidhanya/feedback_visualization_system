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
        <div className="login-page">
            <div className="login-card">
                {/* Header */}
                <div className="login-header-new">
                    <div className="login-logo-wrap">
                        <CampusLensIcon size={48} color="#0f172a" />
                    </div>
                    <h1 className="login-app-name">CampusLens</h1>
                    <div className="login-role-badge">
                        ANALYTICS PORTAL
                    </div>
                </div>

                {/* Role Tabs */}
                <div className="login-tabs">
                    {['admin', 'student'].map(tab => (
                        <button
                            key={tab}
                            id={`tab-${tab}`}
                            className={`login-tab${activeTab === tab ? ' active' : ''}`}
                            onClick={() => { setActiveTab(tab); setError(''); setForm({ email: '', password: '' }); }}
                        >
                            {tab === 'admin'
                                ? <><FiShield size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Admin</>
                                : <><FiBook size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Student</>
                            }
                        </button>
                    ))}
                </div>

                <form className="login-form" onSubmit={handleSubmit} id="login-form">
                    {error && (
                        <div className="login-error">
                            <FiAlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email</label>
                        <input
                            id="email-input"
                            type="email"
                            value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            placeholder={placeholders[activeTab].email}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                            id="password-input"
                            type="password"
                            value={form.password}
                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        id="login-btn"
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading
                            ? <><FiLoader size={14} style={{ marginRight: '0.4rem' }} />Signing in...</>
                            : `Sign in as ${placeholders[activeTab].hint}`
                        }
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>
                    Default password: <code style={{ color: 'var(--clr-primary-h)' }}>student123</code> / <code style={{ color: 'var(--clr-primary-h)' }}>admin123</code>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
