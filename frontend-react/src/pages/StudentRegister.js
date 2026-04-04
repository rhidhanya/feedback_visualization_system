import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    FiUser, FiMail, FiLock, FiAlertTriangle, FiLoader, 
    FiActivity, FiBarChart2, FiDatabase, FiHash, FiBook, FiHome, FiArrowRight
} from 'react-icons/fi';
import { CampusLensIcon } from '../components/CollegePulseLogo';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './EcoAuth.css';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const StudentRegister = () => {
    const { registerStudent, loading } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        rollNumber: '', department: '', semester: '', residenceType: ''
    });
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const [loadingDepts, setLoadingDepts] = useState(true);

    useEffect(() => {
        api.get('/departments')
            .then(res => setDepartments(res.data.data || []))
            .catch(() => setDepartments([]))
            .finally(() => setLoadingDepts(false));
    }, []);

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) return setError('Passwords do not match');
        if (form.password.length < 6) return setError('Password must be at least 6 characters');
        if (!form.department) return setError('Please select your department');
        if (!form.semester) return setError('Please select your semester');
        if (!form.residenceType) return setError('Please select your residence type');

        const result = await registerStudent({
            name: form.name,
            email: form.email,
            password: form.password,
            rollNumber: form.rollNumber,
            department: form.department,
            semester: Number(form.semester),
            residenceType: form.residenceType,
            role: 'student',
        });

        if (!result.success) {
            setError(result.message);
            return;
        }
        navigate('/student/home', { replace: true });
    };

    return (
        <div className="eco-auth-page">
            
            {/* LEFT PANEL */}
            <div className="eco-split-left" style={{ display: window.innerWidth > 968 ? 'flex' : 'none' }}>
                <div style={{ maxWidth: '480px' }}>
                    <div className="eco-logo-wrap">
                        <div className="eco-logo-icon">
                            <CampusLensIcon size={24} color="#ffffff" />
                        </div>
                        <h2 className="eco-logo-text">CampusLens</h2>
                    </div>

                    <h1 className="eco-hero-title">
                        Elevate <br/>
                        <span className="highlight">Campus Feedback.</span>
                    </h1>

                    <p className="eco-hero-desc">
                        Empower your institution. Create an account to access insightful dashboards and help shape the future of your campus.
                    </p>

                    <div className="eco-features">
                        <div className="eco-feature">
                            <div className="eco-feature-icon">
                                <FiActivity size={20} />
                            </div>
                            <div>
                                <h4>Intelligent Analytics</h4>
                                <p>Automated real-time feedback categorization</p>
                            </div>
                        </div>

                        <div className="eco-feature" style={{ marginTop: '2rem' }}>
                            <div className="eco-feature-icon">
                                <FiDatabase size={20} />
                            </div>
                            <div>
                                <h4>Domain Insights</h4>
                                <p>Compare satisfaction metrics across departments</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - FORM */}
            <div className="eco-split-right">
                <div className="eco-form-container">
                    <h2 className="eco-form-title">Create Account</h2>
                    <p className="eco-form-subtitle">Fill in your details to get started</p>
                    
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="eco-error">
                                <FiAlertTriangle size={16} style={{ flexShrink: 0 }} />
                                {error}
                            </div>
                        )}

                        <div className="eco-input-group">
                            <label>Full Name</label>
                            <div className="eco-input-wrapper">
                                <FiUser className="eco-input-icon" size={16} />
                                <input
                                    className="eco-input with-icon"
                                    type="text"
                                    value={form.name}
                                    onChange={set('name')}
                                    placeholder="John Doe"
                                    required
                                    minLength={2}
                                />
                            </div>
                        </div>

                        <div className="eco-input-group">
                            <label>Email Address</label>
                            <div className="eco-input-wrapper">
                                <FiMail className="eco-input-icon" size={16} />
                                <input
                                    className="eco-input with-icon"
                                    type="email"
                                    value={form.email}
                                    onChange={set('email')}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="eco-row">
                            <div className="eco-input-group">
                                <label>Password</label>
                                <div className="eco-input-wrapper">
                                    <FiLock className="eco-input-icon" size={16} />
                                    <input
                                        className="eco-input with-icon"
                                        type="password"
                                        value={form.password}
                                        onChange={set('password')}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <div className="eco-input-group">
                                <label>Confirm</label>
                                <div className="eco-input-wrapper">
                                    <FiLock className="eco-input-icon" size={16} />
                                    <input
                                        className="eco-input with-icon"
                                        type="password"
                                        value={form.confirmPassword}
                                        onChange={set('confirmPassword')}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="eco-row">
                            <div className="eco-input-group">
                                <label>Roll Number</label>
                                <div className="eco-input-wrapper">
                                    <FiHash className="eco-input-icon" size={16} />
                                    <input
                                        className="eco-input with-icon"
                                        type="text"
                                        value={form.rollNumber}
                                        onChange={set('rollNumber')}
                                        placeholder="22CS101"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="eco-input-group">
                                <label>Residence</label>
                                <div className="eco-input-wrapper">
                                    <FiHome className="eco-input-icon" size={16} />
                                    <select
                                        className="eco-input with-icon"
                                        value={form.residenceType}
                                        onChange={set('residenceType')}
                                        required
                                    >
                                        <option value="">Select</option>
                                        <option value="dayscholar">Day Scholar</option>
                                        <option value="hosteller">Hosteller</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="eco-row">
                            <div className="eco-input-group">
                                <label>Department</label>
                                <div className="eco-input-wrapper">
                                    <FiBook className="eco-input-icon" size={16} />
                                    <select
                                        className="eco-input with-icon"
                                        value={form.department}
                                        onChange={set('department')}
                                        required
                                        disabled={loadingDepts}
                                    >
                                        <option value="">{loadingDepts ? 'Loading…' : 'Department'}</option>
                                        {departments.map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="eco-input-group">
                                <label>Semester</label>
                                <div className="eco-input-wrapper">
                                    <FiBook className="eco-input-icon" size={16} />
                                    <select
                                        className="eco-input with-icon"
                                        value={form.semester}
                                        onChange={set('semester')}
                                        required
                                    >
                                        <option value="">Sem</option>
                                        {SEMESTERS.map(s => (
                                            <option key={s} value={s}>Sem {s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="eco-btn-primary"
                            disabled={loading}
                        >
                            {loading ? <FiLoader size={18} className="spin" /> : 
                            <>
                                Create Account
                                <FiArrowRight size={16} style={{ marginLeft: '4px' }} />
                            </>}
                        </button>
                    </form>

                    <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.875rem', position: 'relative' }}>
                        <div style={{ 
                            position: 'absolute', top: '50%', left: 0, right: 0, 
                            borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 1 
                        }}></div>
                        <span style={{ 
                            background: '#070a13', padding: '0 1rem', 
                            color: '#64748b', position: 'relative', zIndex: 2 
                        }}>
                            Already a member? <Link to="/login" className="eco-link" style={{ color: '#ffffff' }}>Log In</Link>
                        </span>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default StudentRegister;
