import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLoader, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import { CampusLensLogo } from '../components/CollegePulseLogo';
import { useAuth } from '../context/AuthContext';
import './EcoAuth.css'; // New styles

const Login = () => {
    const { login, loading } = useAuth();
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

        if (result.role === 'admin') navigate('/admin/domain-overview', { replace: true });
        else if (result.role === 'student') navigate('/student/home', { replace: true });
        else if (result.role === 'hod') navigate('/hod/dashboard', { replace: true });
        else if (result.role === 'domain_head') navigate('/domain-head/dashboard', { replace: true });
        else if (['principal', 'dean'].includes(result.role)) navigate('/principal/dashboard', { replace: true });
        else if (result.role === 'faculty') setError('Access Denied: The Faculty Dashboard has been deprecated.');
        else navigate('/unauthorized', { replace: true });
    };

    return (
        <div className="eco-auth-page">
            <div className="eco-login-center">
                <div className="eco-login-card">
                    
                    <div className="eco-login-header">
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <CampusLensLogo dark={true} iconSize={42} />
                        </div>
                        <p className="eco-form-subtitle">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="eco-error">
                                <FiAlertTriangle size={16} style={{ flexShrink: 0 }} />
                                {error}
                            </div>
                        )}

                        <div className="eco-input-group">
                            <label>Email</label>
                            <input
                                className="eco-input"
                                value={form.email}
                                onChange={handleChange('email')}
                                placeholder="name@example.com"
                                required
                                type="text"
                            />
                        </div>

                        <div className="eco-input-group">
                            <label>Password</label>
                            <div className="eco-input-wrapper">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="eco-input"
                                    value={form.password}
                                    onChange={handleChange('password')}
                                    placeholder="••••••••"
                                    required
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{
                                        position: 'absolute', right: '1rem', background: 'none', border: 'none',
                                        color: '#64748b', cursor: 'pointer', display: 'flex'
                                    }}
                                >
                                    {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="eco-btn-primary"
                            disabled={loading}
                        >
                            {loading ? <FiLoader size={18} className="spin" /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="eco-form-footer">
                        <div style={{ marginBottom: '1rem' }}>
                            <Link to="#" className="eco-link" style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Forgot password?</Link>
                        </div>
                        <div>
                            Don't have an account? <Link to="/student-register" className="eco-link" style={{ color: '#3b82f6' }}>Register</Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
