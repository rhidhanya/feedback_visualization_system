import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser } from 'react-icons/fi';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

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
        navigate('/admin/login');
    };

    if (window.location.pathname === '/admin/login' || window.location.pathname === '/unauthorized') {
        return <>{children}</>;
    }

    return (
        <div className="app-layout">
            <Sidebar user={user} />
            <div className="main-wrapper">
                <header className="top-navbar">
                    <div className="spacer"></div>
                    {user && (
                        <div className="user-menu">
                            <span className="user-name"><FiUser /> {user.name}</span>
                            <button className="logout-btn" onClick={handleLogout}>
                                <FiLogOut /> Logout
                            </button>
                        </div>
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
