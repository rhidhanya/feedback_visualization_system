import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token dynamically for every request
// ── Portal Detection for Storage Keys ───────────────────────────────────
const getPortalContext = () => {
    const path = window.location.pathname.toLowerCase();
    
    // Dashboard/Home paths
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/student')) return 'student';
    if (path.startsWith('/faculty')) return 'faculty';
    if (path.startsWith('/hod')) return 'hod';
    if (path.startsWith('/principal') || path.startsWith('/monitor') || path.includes('principal')) return 'principal';
    if (path.startsWith('/domain-head') || path.includes('incharge') || path.includes('-dashboard')) return 'incharge';
    
    // Login paths
    if (path.includes('/login/student') || path.includes('/student-login') || path.includes('/student/login')) return 'student';
    if (path.includes('/admin/login')) return 'admin';
    if (path.includes('/login/faculty') || path.includes('/faculty/login')) return 'faculty';
    if (path.includes('/login/principal')) return 'principal';
    if (path.includes('/login/hod')) return 'hod';
    if (path.includes('/login/incharge') || path.includes('incharge-login')) return 'incharge';
    
    return 'general';
};

// Request Interceptor: Dynamically attach namespaced token
api.interceptors.request.use(
    (config) => {
        const ctx = getPortalContext();
        const tokenKey = `${ctx}_auth_token`;
        const token = localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey);
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (err) => Promise.reject(err)
);

// Response Interceptor: Handle 401 Unauthorized errors
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            const path = window.location.pathname;
            if (path.includes('/login') || path === '/' || path === '/admin/login') {
                return Promise.reject(err);
            }

            const ctx = getPortalContext();
            const tokenKey = `${ctx}_auth_token`;
            const userKey = `${ctx}_auth_user`;

            let storedUser = sessionStorage.getItem(userKey) || localStorage.getItem(userKey);
            const user = storedUser ? JSON.parse(storedUser) : null;

            // Clear namespaced storage
            sessionStorage.removeItem(tokenKey);
            sessionStorage.removeItem(userKey);
            localStorage.removeItem(tokenKey);
            localStorage.removeItem(userKey);

            // Redirect to appropriate login portal
            const role = user?.role;
            if (role === 'admin') window.location.href = '/admin/login';
            else if (['dean', 'principal'].includes(role)) window.location.href = '/login/principal';
            else if (role === 'faculty' || role === 'hod') window.location.href = '/login/faculty';
            else if (role === 'domain_head') window.location.href = '/login/incharge';
            else window.location.href = '/login/student';
        }
        return Promise.reject(err);
    }
);

export default api;
