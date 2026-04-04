import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser } from 'react-icons/fi';
import Sidebar from './Sidebar';
import ProfileCard from './ProfileCard';
import './Layout.css';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // Redirect to login if not authenticated (optional, depends on route protection)
            // navigate('/login'); 
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (window.location.pathname === '/unauthorized') {
        return <>{children}</>;
    }

    return (
        <div className="app-layout">
            <Sidebar user={user} />
            <div className="main-wrapper">
                <header className="top-navbar">
                    <div className="spacer"></div>
                    {user && (
                        <ProfileCard variant="topbar" />
                    )}
                </header>
                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
