import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    FiMail, FiLock, FiHash, FiEye, FiEyeOff, FiLoader, FiAlertTriangle
} from 'react-icons/fi';
import { CampusLensIcon } from '../components/CollegePulseLogo';
import { useAuth } from '../context/AuthContext';

const FacultyLogin = () => {
    const { unifiedFacultyHodLogin, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '', departmentCode: '' });
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

        const result = await unifiedFacultyHodLogin(emailToSubmit, form.password, form.departmentCode.trim() || '');
        if (!result.success) {
            setError(result.message);
            return;
        }

        // Redirect based on role
        if (result.role === 'hod') {
            navigate('/hod/dashboard', { replace: true });
        } else if (result.role === 'domain_head') {
            navigate('/domain-head/dashboard', { replace: true });
        } else if (result.role === 'faculty') {
            navigate('/faculty/dashboard', { replace: true });
        } else {
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
                    <div className="login-role-badge faculty">
                        FACULTY & HOD ACCESS
                    </div>
                </div>

                <form className="login-form-premium" onSubmit={handleSubmit} id="faculty-login-form">
                    {error && (
                        <div className="login-error-premium" id="login-error">
                            <FiAlertTriangle size={14} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="login-label-premium" htmlFor="faculty-email-input">Email Address</label>
                        <div className="input-icon-wrap">
                            <span className="input-icon"><FiMail size={15} /></span>
                            <input
                                id="faculty-email-input"
                                value={form.email}
                                onChange={handleChange('email')}
                                placeholder="name@bitsathy.in"
                                required
                                type="text"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="login-label-premium" htmlFor="faculty-password-input">Password</label>
                        <div className="input-icon-wrap">
                            <span className="input-icon"><FiLock size={15} /></span>
                            <input
                                id="faculty-password-input"
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

                    <div>
                        <label className="login-label-premium" htmlFor="department-id-input">Department ID <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>(Required for HOD)</span></label>
                        <div className="input-icon-wrap">
                            <span className="input-icon"><FiHash size={15} /></span>
                            <input
                                id="department-id-input"
                                type="text"
                                value={form.departmentCode}
                                onChange={handleChange('departmentCode')}
                                placeholder="e.g. CSE, IT, MECH (HOD only)"
                            />
                        </div>
                    </div>

                    <button
                        id="faculty-login-btn"
                        type="submit"
                        className="btn-login-gradient btn-gradient-faculty"
                        disabled={loading}
                    >
                        {loading ? <FiLoader size={16} className="spin" /> : 'Sign In'}
                    </button>
                </form>

                <div className="login-footer-links">
                    <div className="login-divider">or</div>
                    <span>
                        Student?{' '}
                        <Link to="/student/login" className="student-link">Student Login</Link>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FacultyLogin;
