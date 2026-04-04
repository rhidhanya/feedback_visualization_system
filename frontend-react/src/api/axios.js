import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Cache for retrying requests to prevent infinite loops
const MAX_RETRIES = 2;

// Request interceptor: attach token dynamically for every request
// ── Helper to determine which storage keys to use ──────────────────────────
const getAuthKeys = () => {
    return {
        TOKEN: 'campuslens_auth_token',
        USER: 'campuslens_auth_user'
    };
};

api.interceptors.request.use(
    (config) => {
        // Robust URL normalization: ensure no redundant slashes
        if (config.url) {
            // Remove leading slashes to correctly append to baseURL
            config.url = config.url.replace(/^\/+/, '');
        }

        const { TOKEN } = getAuthKeys();
        const token = localStorage.getItem(TOKEN) || sessionStorage.getItem(TOKEN);
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (err) => Promise.reject(err)
);

// Response Interceptor: Handle errors and automatic retries
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const { config } = err;

        // 1. Handle 401 Unauthorized errors (Auth cleanup)
        if (err.response?.status === 401) {
            const path = window.location.pathname;
            if (path.includes('/login') || path === '/') {
                return Promise.reject(err);
            }

            const { TOKEN, USER } = getAuthKeys();
            sessionStorage.removeItem(TOKEN);
            sessionStorage.removeItem(USER);
            localStorage.removeItem(TOKEN);
            localStorage.removeItem(USER);

            window.location.href = '/login';
            return Promise.reject(err);
        }

        // 2. Automatic Retry Logic for transient errors
        // Retry if it's a network error or a 5xx server error (except POST requests for safety)
        const isRetryableError = !err.response || (err.response.status >= 500 && err.response.status <= 599);
        const isIdempotent = config.method === 'get' || config.method === 'head';

        if (isRetryableError && isIdempotent && (!config._retryCount || config._retryCount < MAX_RETRIES)) {
            config._retryCount = (config._retryCount || 0) + 1;
            console.warn(`[Axios] Retrying ${config.method.toUpperCase()} ${config.url} (Attempt ${config._retryCount})...`);
            
            // Add a small delay before retrying (exponential backoff)
            const delay = config._retryCount * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return api(config);
        }

        return Promise.reject(err);
    }
);

export default api;
