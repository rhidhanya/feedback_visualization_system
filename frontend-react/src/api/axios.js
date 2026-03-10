import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token dynamically for every request
// ── Helper to determine which storage keys to use ──────────────────────────
const getAuthKeys = () => {
    const isLocalAdmin = window.location.pathname.startsWith('/admin');
    const prefix = isLocalAdmin ? 'admin_' : 'campuslens_';
    return {
        TOKEN: `${prefix}auth_token`,
        USER: `${prefix}auth_user`
    };
};

// Request Interceptor: Dynamically attach unified token
api.interceptors.request.use(
    (config) => {
        const { TOKEN } = getAuthKeys();
        const token = localStorage.getItem(TOKEN) || sessionStorage.getItem(TOKEN);
        
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

            const { TOKEN, USER } = getAuthKeys();
            
            // Clear role-specific storage
            sessionStorage.removeItem(TOKEN);
            sessionStorage.removeItem(USER);
            localStorage.removeItem(TOKEN);
            localStorage.removeItem(USER);

            // Redirect to appropriate login portal
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/admin')) {
                window.location.href = '/admin/login';
            } else {
                window.location.href = '/login';
            }
        }
        return Promise.reject(err);
    }
);

export default api;
