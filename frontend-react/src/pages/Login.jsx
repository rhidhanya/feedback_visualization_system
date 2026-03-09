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
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

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
            background: 'var(--bg-light)',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{
                background: 'var(--card-bg)',
                padding: '40px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                width: '100%',
                maxWidth: '420px'
            }}>
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <div style={{
                        background: 'var(--accent-primary)',
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        color: 'white',
                        fontSize: '1.5rem',
                        margin: '0 auto 16px'
                    }}>
                        <img src={logo} alt="CampusLens Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                        Welcome Back
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Sign in to your account
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
                        border: '1px solid var(--clr-danger-lt)'
                    }}>
                        {error}
                    </div>
                )}

                {/* ── Tabs ── */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--clr-surface-2)', padding: '0.4rem', borderRadius: '12px' }}>
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
                                color: activeTab === tab ? 'var(--clr-primary)' : 'var(--clr-text-2)',
                                fontWeight: activeTab === tab ? '700' : '600',
                                fontSize: '0.8rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                boxShadow: activeTab === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
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
                            color: 'var(--text-main)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'border 0.2s ease',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                            required
                        />
                    </div>

                    {activeTab === 'faculty' && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Faculty ID</label>
                            <input
                                type="text"
                                name="facultyId"
                                value={facultyId}
                                onChange={onChange}
                                style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s ease', fontFamily: 'Inter, sans-serif' }}
                                required
                            />
                        </div>
                    )}

                    {activeTab === 'hod' && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>HOD ID</label>
                            <input
                                type="text"
                                name="hodId"
                                value={hodId}
                                onChange={onChange}
                                style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s ease', fontFamily: 'Inter, sans-serif' }}
                                required
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            color: 'var(--text-main)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'border 0.2s ease',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            background: loading ? '#ccc' : 'var(--accent-primary)',
                            color: 'white',
                            fontWeight: '600',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s ease',
                            fontFamily: 'Inter, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.background = 'var(--accent-secondary)';
                                e.target.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.background = 'var(--accent-primary)';
                                e.target.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>Create Account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
