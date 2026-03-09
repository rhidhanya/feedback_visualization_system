import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiLoader, FiAlertTriangle
} from 'react-icons/fi';
import { CampusLensIcon } from '../components/CollegePulseLogo';
import { useAuth } from '../context/AuthContext';

const StudentLogin = () => {
    const { studentLogin, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const handleChange = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        let emailToSubmit = form.email.trim();
        
        // If user enters just username (no @), append @bitsathy.in for convenience
        if (emailToSubmit && !emailToSubmit.includes('@')) {
            emailToSubmit += '@bitsathy.in';
        }
        
        const result = await studentLogin(emailToSubmit, form.password);
        if (!result.success) {
            setError(result.message);
            return;
        }
        navigate('/student/home', { replace: true });
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
                    <div className="login-role-badge student">
                        STUDENT ACCESS
                    </div>
                </div>

                {/* Form */}
                <form className="login-form-premium" onSubmit={handleSubmit} id="student-login-form">
                    {error && (
                        <div className="login-error-premium" id="login-error">
                            <FiAlertTriangle size={14} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label className="login-label-premium" htmlFor="student-email-input">Student Username</label>
                        <div className="input-icon-wrap">
                            <span className="input-icon"><FiMail size={15} /></span>
                            <input
                                id="student-email-input"
                                value={form.email}
                                onChange={handleChange('email')}
                                placeholder="example: student1 or admin123"
                                required
                                autoComplete="username"
                                type="text"
                            />
                        </div>
                        <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                            Institutional email recommended. System appends @bitsathy.in if domain is omitted.
                        </small>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="login-label-premium" htmlFor="student-password-input">Password</label>
                        <div className="input-icon-wrap">
                            <span className="input-icon"><FiLock size={15} /></span>
                            <input
                                id="student-password-input"
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
                        id="student-login-btn"
                        type="submit"
                        className="btn-login-gradient btn-gradient-student"
                        disabled={loading}
                    >
                        {loading
                            ? <><FiLoader size={16} /> Signing in...</>
                            : <><FiUser size={16} /> Sign In</>
                        }
                    </button>
                </form>

                {/* Footer links */}
                <div className="login-footer-links">
                    <div className="login-divider">or</div>
                    <span>
                        New here?{' '}
                        <Link to="/student-register" id="register-link">Create an account</Link>
                    </span>
                    <span>
                        Faculty?{' '}
                        <Link to="/faculty/login" id="faculty-login-link">Faculty Login</Link>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
