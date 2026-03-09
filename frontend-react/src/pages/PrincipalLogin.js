import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiMail, FiLock, FiEye, FiEyeOff, FiLoader, FiAlertTriangle
} from 'react-icons/fi';
import { CampusLensIcon } from '../components/CollegePulseLogo';
import { useAuth } from '../context/AuthContext';

const PrincipalLogin = () => {
    const navigate = useNavigate();
    const { monitorLogin, loading } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleChange = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const result = await monitorLogin(form.email, form.password);

        if (!result.success) {
            setError(result.message);
            return;
        }

        // Redirect to Principal dashboard using React Router
        navigate('/principal/dashboard', { replace: true });
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
                    <div className="login-role-badge principal">
                        PRINCIPAL ACCESS
                    </div>
                </div>

                <form className="login-form-premium" onSubmit={handleSubmit} id="principal-login-form">
                    {error && (
                        <div className="login-error-premium" id="login-error">
                            <FiAlertTriangle size={14} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="login-label-premium" htmlFor="principal-email-input">Email Address</label>
                        <div className="input-icon-wrap">
                            <span className="input-icon"><FiMail size={15} /></span>
                            <input
                                id="principal-email-input"
                                type="email"
                                value={form.email}
                                onChange={handleChange('email')}
                                placeholder="principal@bitsathy.in"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="login-label-premium" htmlFor="principal-password-input">Password</label>
                        <div className="input-icon-wrap">
                            <span className="input-icon"><FiLock size={15} /></span>
                            <input
                                id="principal-password-input"
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
                        id="principal-login-btn"
                        type="submit"
                        className="btn-login-gradient btn-gradient-principal"
                        disabled={loading}
                    >
                        {loading ? <FiLoader size={16} className="spin" /> : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PrincipalLogin;
