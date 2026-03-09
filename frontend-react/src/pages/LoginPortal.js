import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiUser, FiBriefcase, FiTruck, FiAward, FiArrowRight, FiShield,
} from 'react-icons/fi';
import { CampusLensIcon } from '../components/CollegePulseLogo';

const ROLES = [
    {
        id: 'student',
        label: 'Student',
        subtitle: 'Submit faculty & campus feedback',
        icon: FiUser,
        color: 'var(--clr-primary)',
        bg: 'var(--clr-primary-lt)',
        border: 'var(--clr-border)',
        path: '/login/student',
        cred: 'yourname@student.edu',
    },
    {
        id: 'faculty',
        label: 'Faculty',
        subtitle: 'View your course analytics',
        icon: FiBriefcase,
        color: 'var(--clr-accent)',
        bg: 'var(--clr-primary-lt)',
        border: 'var(--clr-border)',
        path: '/login/faculty',
        cred: 'name@bitsathy.in',
    },
    {
        id: 'transport-incharge',
        label: 'Transport Incharge',
        subtitle: 'Transport domain analytics',
        icon: FiTruck,
        color: '#d97706',
        bg: 'rgba(217,119,6,0.08)',
        border: 'rgba(217,119,6,0.2)',
        path: '/login/transport-incharge',
        cred: 'transport-head@bitsathy.in',
    },
    {
        id: 'mess-incharge',
        label: 'Mess Incharge',
        subtitle: 'Mess & food feedback',
        icon: ({ size }) => <span style={{ fontSize: size }}>🍽</span>,
        color: '#15803d',
        bg: 'rgba(21,128,61,0.08)',
        border: 'rgba(21,128,61,0.2)',
        path: '/login/mess-incharge',
        cred: 'mess-manager@bitsathy.in',
    },
    {
        id: 'hostel-incharge',
        label: 'Hostel Incharge',
        subtitle: 'Hostel facilities feedback',
        icon: ({ size }) => <span style={{ fontSize: size }}>🏠</span>,
        color: '#7c3aed',
        bg: 'rgba(124,58,237,0.08)',
        border: 'rgba(124,58,237,0.2)',
        path: '/login/hostel-incharge',
        cred: 'hostel-manager@bitsathy.in',
    },
    {
        id: 'sanitation-incharge',
        label: 'Sanitation Incharge',
        subtitle: 'Sanitation & hygiene feedback',
        icon: ({ size }) => <span style={{ fontSize: size }}>🧹</span>,
        color: '#0891b2',
        bg: 'rgba(8,145,178,0.08)',
        border: 'rgba(8,145,178,0.2)',
        path: '/login/sanitation-incharge',
        cred: 'sanitation-incharge@bitsathy.in',
    },
    {
        id: 'principal',
        label: 'Principal',
        subtitle: 'Highest-level monitoring',
        icon: FiAward,
        color: '#1e293b',
        bg: 'rgba(30,41,59,0.08)',
        border: 'rgba(30,41,59,0.2)',
        path: '/login/principal',
        cred: 'principal@bitsathy.in',
    },
];

const LoginPortal = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0f4f8 0%, #e8f4f8 50%, #f0f4f8 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '2rem 1rem',
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <CampusLensIcon size={64} color="var(--clr-primary)" />
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>
                    CampusLens
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.05rem' }}>
                    Institutional Analytics & Feedback Platform
                </p>
            </div>

            <div style={{ marginBottom: '1.5rem', color: '#475569', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Select Your Role to Continue
            </div>

            {/* Role Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1rem',
                maxWidth: 900,
                width: '100%',
                marginBottom: '2rem',
            }}>
                {ROLES.map(role => {
                    const Icon = role.icon;
                    return (
                        <button
                            key={role.id}
                            id={`portal-${role.id}`}
                            onClick={() => navigate(role.path)}
                            style={{
                                background: '#fff',
                                border: `1.5px solid ${role.border}`,
                                borderRadius: 14,
                                padding: '1.25rem 1.5rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = `0 8px 24px ${role.border}`;
                                e.currentTarget.style.borderColor = role.color;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                e.currentTarget.style.borderColor = role.border;
                            }}
                        >
                            <div style={{
                                width: 44, height: 44, borderRadius: 10,
                                background: role.bg, color: role.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Icon size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.15rem' }}>
                                    {role.label}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                    {role.subtitle}
                                </div>
                            </div>
                            <FiArrowRight size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        </button>
                    );
                })}
            </div>

            {/* Quick Credentials Panel */}
            <div style={{
                background: '#fff', borderRadius: 14, padding: '1.25rem 1.5rem',
                border: '1px solid #e2e8f0', maxWidth: 900, width: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiShield size={14} /> Test Credentials (Demo Mode)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', fontSize: '0.78rem', color: '#64748b' }}>
                    <div><strong>Student:</strong> username or name@bitsathy.in / <code>student123</code></div>
                    <div><strong>Faculty:</strong> name@bitsathy.in / <code>faculty123</code></div>
                    <div><strong>Transport:</strong> transport-head@bitsathy.in / <code>incharge123</code></div>
                    <div><strong>Mess:</strong> mess-manager@bitsathy.in / <code>incharge123</code></div>
                    <div><strong>Hostel:</strong> hostel-manager@bitsathy.in / <code>incharge123</code></div>
                    <div><strong>Sanitation:</strong> sanitation-incharge@bitsathy.in / <code>incharge123</code></div>
                    <div><strong>Dean:</strong> dean@bitsathy.in / <code>admin123</code></div>
                    <div><strong>Principal:</strong> principal@bitsathy.in / <code>admin123</code></div>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Example student: ananya.krishnan or ananya.krishnan@bitsathy.in / student123
                </div>
            </div>

            <div style={{ marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                © 2025 CampusLens · Institutional Feedback System
            </div>
        </div>
    );
};

export default LoginPortal;
