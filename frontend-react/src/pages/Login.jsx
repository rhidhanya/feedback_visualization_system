import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';
import logo from '../logo.png';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        hodId: '',
        facultyId: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('student');
    const { email, password, hodId, facultyId } = formData;
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let endpoint = 'http://localhost:5000/api/auth/login';
            if (activeTab === 'student') endpoint = 'http://localhost:5000/api/auth/student-login';
            if (activeTab === 'faculty') endpoint = 'http://localhost:5000/api/auth/faculty-login';
            if (activeTab === 'hod') endpoint = 'http://localhost:5000/api/auth/hod-login';

            const res = await axios.post(endpoint, formData);
            console.log(res.data);
            localStorage.setItem('campuslens_auth_token', res.data.token);
            localStorage.setItem('campuslens_auth_user', JSON.stringify(res.data.user));

            if (res.data.user.role === 'admin') {
                navigate('/admin');
            } else if (res.data.user.role === 'hod') {
                navigate('/hod/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.msg || err.response?.data?.message || 'Invalid Credentials';
            console.error('Login error:', errorMsg);
            setError(errorMsg);
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'var(--clr-bg)',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{
                background: 'var(--clr-surface)',
                padding: '40px',
                borderRadius: '16px',
                border: '1px solid var(--clr-border)',
                boxShadow: 'var(--shadow-lg)',
                width: '100%',
                maxWidth: '430px'
            }}>
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <div style={{
                        background: 'var(--clr-logo-bg)',
                        width: '64px',
                        height: '64px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        padding: '12px'
                    }}>
                        <img src={logo} alt="CL" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--clr-primary)', marginBottom: '8px' }}>
                        Welcome Back
                    </h2>
                    <p style={{ color: 'var(--clr-text-3)', fontSize: '0.95rem' }}>
                        CampusLens Analytics & Feedback
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'var(--clr-danger-lt)',
                        color: 'var(--clr-danger)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '0.9rem',
                        border: '1px solid var(--clr-danger-lt)',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {/* ── Tabs ── */}
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--clr-primary-lt)', padding: '0.35rem', borderRadius: '12px' }}>
                    {['student', 'faculty', 'hod', 'admin'].map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => { setActiveTab(tab); setError(''); }}
                            style={{
                                flex: 1,
                                padding: '0.6rem 0',
                                border: 'none',
                                background: activeTab === tab ? '#fff' : 'transparent',
                                color: activeTab === tab ? 'var(--clr-primary)' : 'var(--clr-text-3)',
                                fontWeight: activeTab === tab ? '700' : '600',
                                fontSize: '0.8rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                textTransform: 'capitalize',
                                transition: 'all 0.2s',
                            }}
                        >
                            {tab === 'hod' ? 'HOD' : tab}
                        </button>
                    ))}
                </div>

                <form onSubmit={onSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            color: 'var(--clr-text)',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                        }}>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                border: '1px solid var(--clr-border)',
                                borderRadius: '10px',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'all 0.2s',
                                background: '#f8fafc'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.background = '#fff'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--clr-border)'; e.target.style.background = '#f8fafc'; }}
                            required
                        />
                    </div>

                    {activeTab === 'faculty' && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: 'var(--clr-text)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Faculty ID</label>
                            <input
                                type="text"
                                name="facultyId"
                                value={facultyId}
                                onChange={onChange}
                                style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--clr-border)', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', background: '#f8fafc' }}
                                onFocus={(e) => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.background = '#fff'; }}
                                onBlur={(e) => { e.target.style.borderColor = 'var(--clr-border)'; e.target.style.background = '#f8fafc'; }}
                                required
                            />
                        </div>
                    )}

                    {activeTab === 'hod' && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: 'var(--clr-text)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>HOD ID</label>
                            <input
                                type="text"
                                name="hodId"
                                value={hodId}
                                onChange={onChange}
                                style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--clr-border)', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', background: '#f8fafc' }}
                                onFocus={(e) => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.background = '#fff'; }}
                                onBlur={(e) => { e.target.style.borderColor = 'var(--clr-border)'; e.target.style.background = '#f8fafc'; }}
                                required
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            color: 'var(--clr-text)',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                        }}>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                border: '1px solid var(--clr-border)',
                                borderRadius: '10px',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'all 0.2s',
                                background: '#f8fafc'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.background = '#fff'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--clr-border)'; e.target.style.background = '#f8fafc'; }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            background: loading ? 'var(--clr-muted)' : 'var(--clr-primary)',
                            color: 'white',
                            fontWeight: '700',
                            padding: '14px',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(27, 49, 76, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.background = 'var(--clr-hover-bg)';
                                e.target.style.color = 'var(--clr-hover-text)';
                                e.target.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.background = 'var(--clr-primary)';
                                e.target.style.color = 'white';
                                e.target.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--clr-text-3)', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--clr-primary)', textDecoration: 'none', fontWeight: '700' }}>Create Account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
