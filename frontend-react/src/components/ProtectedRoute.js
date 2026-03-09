import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps a route that requires authentication.
 * @param {string|string[]} role - accepted role(s), e.g. 'admin' | ['dean','principal']
 */
const ProtectedRoute = ({ children, role }) => {
    const { user, token, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>Loading session...</div>;
    }

    if (!token || !user) {
        // Find the appropriate login path based on the role this route requires
        const requiredRoles = Array.isArray(role) ? role : role ? [role] : [];
        let loginPath = '/login/student';
        
        if (requiredRoles.includes('admin')) loginPath = '/admin/login';
        else if (requiredRoles.includes('principal') || requiredRoles.includes('dean')) loginPath = '/login/principal';
        else if (requiredRoles.includes('faculty') || requiredRoles.includes('hod')) loginPath = '/login/faculty';
        else if (requiredRoles.includes('domain_head')) loginPath = '/login/incharge';
        
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    // Support single string or array of allowed roles
    const allowedRoles = Array.isArray(role) ? role : role ? [role] : [];

    // STRICT ROLE CHECK: User must have the role required by this specific route
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;
