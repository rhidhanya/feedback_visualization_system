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
        let loginPath = '/login';
        
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    // Support single string or array of allowed roles
    const allowedRoles = Array.isArray(role) ? role : role ? [role] : [];

    // STRICT ROLE CHECK: User must have the role required by this specific route
    // If the user's role is missing but they are still authenticated, we should attempt to gracefully fallback
    // Or if role simply doesn't match, we block
    const userRole = typeof user?.role === 'string' ? user.role.toLowerCase() : user?.role;
    const normalizedRoles = allowedRoles.map(r => typeof r === 'string' ? r.toLowerCase() : r);
    
    if (normalizedRoles.length > 0 && userRole) {
        // Support role being an array (in cases where they might have multiple roles somehow)
        const hasRole = Array.isArray(userRole) 
            ? userRole.some(r => normalizedRoles.includes(r.toLowerCase()))
            : normalizedRoles.includes(userRole);
            
        if (!hasRole) {
            console.log(`[ProtectedRoute] Unauthorized! normalizedRoles:`, normalizedRoles, `userRole:`, userRole);
            return <Navigate to="/unauthorized" replace />;
        }
    } else if (normalizedRoles.length > 0 && !userRole) {
        // If they have somehow lost their role but are authenticated, trigger a re-auth instead of unauthorized
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
