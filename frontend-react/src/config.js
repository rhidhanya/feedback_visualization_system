/**
 * Global Configuration for the Frontend Application.
 * Centralizing the API and Socket URLs to make deployment easier.
 */

const getApiBaseUrl = () => {
    // 1. Check for explicit environment variable (useful for separate service hosting like Vercel)
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    // 2. If the frontend and backend are hosted on the same domain/IP (e.g. Render/Heroku)
    // we can use the current origin.
    if (process.env.NODE_ENV === 'production') {
        return window.location.origin;
    }

    // 3. Fallback to default local backend development port
    return 'http://localhost:5000';
};

export const API_CONFIG = {
    BASE_URL: getApiBaseUrl(),
    API_URL: `${getApiBaseUrl()}/api`,
    SOCKET_URL: getApiBaseUrl(),
    ENDPOINTS: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        HEALTH: '/health'
    }
};

export default API_CONFIG;
