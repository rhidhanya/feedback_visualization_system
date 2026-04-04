import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';
import logo from '../logo.png';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { name, email, password, role } = formData;
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/register', formData);
            console.log(res.data);
            localStorage.setItem('campuslens_auth_token', res.data.token);
            localStorage.setItem('campuslens_auth_user', JSON.stringify(res.data.user));

            if (res.data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.msg || err.response?.data?.message || err.message || 'Registration failed';
            console.error('Registration error:', errorMsg);
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
            fontFamily: 'Inter, sans-serif',
            padding: '20px 0'
        }}>
            <div style={{
                background: 'var(--clr-surface)',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)',
                width: '100%',
                maxWidth: '440px'
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
                        <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--clr-primary)', marginBottom: '8px' }}>
                        Create Account
                    </h2>
                    <p style={{ color: 'var(--clr-text-3)', fontSize: '0.95rem' }}>
                        Join CampusLens Analytics Hub
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
                        textAlign: 'center',
                        border: '1px solid var(--clr-danger-lt)'
                    }}>
                        {error}
                    </div>
                )}

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
                        }}>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={onChange}
                            placeholder="Full Name"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
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
                            placeholder="Email"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
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

                    <div style={{ marginBottom: '20px' }}>
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
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
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

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            color: 'var(--clr-text)',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            marginBottom: '6px',
                            textTransform: 'uppercase'
                        }}>User Role</label>
                        <select
                            name="role"
                            value={role}
                            onChange={onChange}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid var(--clr-border)',
                                borderRadius: '10px',
                                fontSize: '0.95rem',
                                outline: 'none',
                                background: '#f8fafc',
                                cursor: 'pointer'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.background = '#fff'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--clr-border)'; e.target.style.background = '#f8fafc'; }}
                        >
                            <option value="user">Student</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            background: 'var(--clr-primary)',
                            color: 'white',
                            fontWeight: '700',
                            padding: '14px',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(27, 49, 76, 0.2)',
                            opacity: loading ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.background = 'var(--clr-hover-bg)';
                                e.target.style.color = 'var(--clr-hover-text)';
                                e.target.style.transform = 'translateY(-1px)';
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
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--clr-text-3)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--clr-primary)', textDecoration: 'none', fontWeight: '700' }}>
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
