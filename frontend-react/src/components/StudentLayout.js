import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampusLensIcon } from './CollegePulseLogo';
import { FiClock } from 'react-icons/fi';
import UserDropdown from './UserDropdown';
import ProfileCard from './ProfileCard';
import BackButton from './BackButton';
import SessionNotifications from './SessionNotifications';

const CountdownTimer = ({ deadline }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        if (!deadline) return;
        const calcTime = () => {
            const now = new Date();
            const end = new Date(deadline);
            const diff = end - now;
            if (diff <= 0) {
                setExpired(true);
                setTimeLeft('Deadline passed');
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            let str = '';
            if (days > 0) str += `${days}d `;
            if (hours > 0 || days > 0) str += `${hours}h `;
            str += `${mins}m ${secs}s`;
            setTimeLeft(str);
        };
        calcTime();
        const timer = setInterval(calcTime, 1000);
        return () => clearInterval(timer);
    }, [deadline]);

    if (!deadline) return null;

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.75rem', background: expired ? 'var(--clr-danger-lt)' : 'var(--clr-accent-lt)',
            borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
            color: expired ? 'var(--clr-danger)' : 'var(--clr-accent)',
            border: `1px solid ${expired ? 'var(--clr-danger-lt)' : 'rgba(0,0,0,0.05)'}`,
        }}>
            <FiClock size={12} />
            {expired ? 'Deadline passed' : timeLeft}
        </div>
    );
};

const StudentLayout = ({ children, deadline, isFeedbackActive }) => {
    const navigate = useNavigate();

    return (
        <div className="student-layout">
            <SessionNotifications />
            <header className="student-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer' }} onClick={() => navigate('/student/home')}>
                    <CampusLensIcon size={36} />
                    <div className="brand-text">
                        <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em', color: 'var(--clr-text)' }}>CampusLens</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Portal</div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {deadline && isFeedbackActive && (
                        <div className="hide-mobile">
                            <CountdownTimer deadline={deadline} />
                        </div>
                    )}
                    
                    <ProfileCard variant="topbar" />
                </div>
            </header>

            <main className="student-content">
                <BackButton />
                {children}
            </main>
            
            <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-text-3)', fontSize: '0.75rem', fontWeight: 500 }}>
                &copy; 2026 CampusLens &bull; Feedback & Analytics System
            </footer>
        </div>
    );
};

export default StudentLayout;
