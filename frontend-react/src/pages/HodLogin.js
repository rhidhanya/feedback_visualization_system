import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// HodLogin is deprecated. Both Faculty and HOD use the unified FacultyLogin.js page.
// This component now just redirects to the unified login.
const HodLogin = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/login/faculty', { replace: true });
    }, [navigate]);

    return null;
};

export default HodLogin;
