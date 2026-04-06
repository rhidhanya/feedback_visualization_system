import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../api/axios';
import GlobalToast from '../components/GlobalToast';
import { API_CONFIG } from '../config';

const AuthContext = createContext();

// Simple fixed keys — sessionStorage is NATIVELY tab-isolated by the browser.
// No custom tab IDs needed. Each browser tab has its own sessionStorage.
// Tab 1 (admin) and Tab 2 (student) cannot read each other's sessionStorage.
const TOKEN_KEY = 'campuslens_auth_token';
const USER_KEY  = 'campuslens_auth_user';

// Read token with sessionStorage priority; fall back to localStorage for
// existing sessions that were stored there before this update.
// Side-effect: migrates the old localStorage entry into sessionStorage.
const readToken = () => {
    const ss = sessionStorage.getItem(TOKEN_KEY);
    if (ss) return ss;
    const ls = localStorage.getItem(TOKEN_KEY);
    if (ls) {
        // Migrate into this tab's sessionStorage so reloads keep working.
        sessionStorage.setItem(TOKEN_KEY, ls);
    }
    return ls;
};

const readUser = () => {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    if (!raw) return null;
    if (!sessionStorage.getItem(USER_KEY)) {
        sessionStorage.setItem(USER_KEY, raw); // migrate
    }
    try { return JSON.parse(raw); } catch { return null; }
};

// Shared error message extraction so "Login failed" is replaced with actionable messages
const getLoginErrorMessage = (err) => {
    if (err.response?.data?.message) return err.response.data.message;
    if (err.response?.data?.error) return String(err.response.data.error);
    if (err.code === 'ERR_NETWORK') return `Cannot reach server. Is the backend running at ${API_CONFIG.BASE_URL}?`;
    if (err.message) return err.message;
    return 'Login failed';
};

export const AuthProvider = ({ children }) => {
    // sessionStorage is natively tab-isolated — Tab 1 (admin) and Tab 2 (student)
    // have completely separate sessionStorage spaces. No custom tab IDs needed.
    // readToken() / readUser() migrate existing localStorage sessions on first load.
    const [token, setToken] = useState(readToken);
    const [user,  setUser]  = useState(readUser);

    // loading=true while we verify the stored token against /auth/me.
    // ProtectedRoute waits for loading=false before deciding to redirect.
    const [loading, setLoading] = useState(() => !!readToken());

    // Toast Notification State
    const [toastNotification, setToastNotification] = useState(null);
    const lastMessageRef = useRef(null);

    // ── Logout ─────────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        // Clear this tab's sessionStorage only (doesn't touch other tabs).
        // Also clear localStorage to clean up legacy/migrated entries.
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    }, []);

    // ── Shared helper to persist auth state ────────────────────────────────
    const persist = useCallback((data) => {
        // Write to sessionStorage ONLY — it is natively tab-isolated.
        // Writing to localStorage is intentionally skipped to prevent
        // a new login on this tab from overwriting tokens in other tabs.
        sessionStorage.setItem(TOKEN_KEY, data.token);
        sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
    }, []);

    // ── Sync Headers ────────────────────────────────────────────────────────
    useEffect(() => {
        if (token) {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common["Authorization"];
        }
    }, [token]);

    // ── Verify session on load ──────────────────────────────────────────────
    // Runs once on mount. Confirms the stored token is still valid with the server.
    // loading stays true until this resolves → ProtectedRoute shows a spinner
    // instead of redirecting, which fixes the "reload → unauthorized" bug.
    useEffect(() => {
        const verifySession = async () => {
            const storedToken = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
            if (!storedToken) {
                setLoading(false);
                return;
            }

            // Ensure the axios header is set before the verification call
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

            try {
                const { data } = await api.get('/auth/me');
                if (data.success) {
                    const mergedUser = { ...data.user };
                    // Preserve role if server response is missing it (safety net)
                    if (!mergedUser.role) {
                        const cachedUser = readUser();
                        if (cachedUser?.role) mergedUser.role = cachedUser.role;
                    }
                    setUser(mergedUser);
                    setToken(storedToken);
                    // Keep sessionStorage in sync with the freshest user data
                    sessionStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
                }
            } catch (err) {
                console.error('[AuthContext] Session verification failed:', err.message);
                // Only force logout on explicit auth rejection (don't log out on network errors)
                if (err.response?.status === 401) {
                    logout();
                }
                // On other errors (5xx, network down), leave the cached token in place
                // so the user isn't unexpectedly kicked out by a temporary server issue.
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, [logout]);

    // ── Real-Time Message Polling ───────────────────────────────────────────
    useEffect(() => {
        let intervalId;

        const pollMessages = async () => {
            if (!token || !user) return;
            try {
                const res = await api.get('/messages');
                if (res.data.success && res.data.data.length > 0) {
                    const messages = res.data.data;
                    const latestMessage = messages[0]; // Assuming descending order from API (sort("-createdAt"))
                    
                    if (lastMessageRef.current && latestMessage._id !== lastMessageRef.current) {
                        // New message detected that was not sent by the current user
                        const isSentByMe = latestMessage.senderRole === user.role && latestMessage.sender?.email && latestMessage.sender.email !== 'system';
                        
                        if (!isSentByMe) {
                            const senderName = latestMessage.sender?.name || latestMessage.senderRole?.toUpperCase() || 'SYSTEM';
                            setToastNotification({
                                title: `New message from ${senderName}`,
                                message: latestMessage.text?.length > 40 ? latestMessage.text.substring(0, 40) + '...' : latestMessage.text
                            });
                        }
                    }
                    // Update ref to track the latest
                    lastMessageRef.current = latestMessage._id;
                }
            } catch (err) {
                // Silently ignore polling errors
            }
        };

        if (token && user && !loading) {
            pollMessages(); // Initial fetch
            intervalId = setInterval(pollMessages, 15000); // Polling slightly slower for stability
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [token, user, loading]);

    // ── Generic login (backward-compat) ────────────────────────────────────
    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            persist(data);
            return { success: true, role: data.user.role };
        } catch (err) {
            return { success: false, message: getLoginErrorMessage(err) };
        } finally { setLoading(false); }
    }, []); // eslint-disable-line

    // ── Student login ──────────────────────────────────────────────────────
    const studentLogin = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/student-login', { email, password });
            persist(data);
            return { success: true, role: data.user.role };
        } catch (err) {
            return { success: false, message: getLoginErrorMessage(err) };
        } finally { setLoading(false); }
    }, []); // eslint-disable-line



    // ── Admin login ────────────────────────────────────────────────────────
    const adminLogin = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/admin-login', { email, password });
            persist(data);
            return { success: true, role: data.user.role };
        } catch (err) {
            return { success: false, message: getLoginErrorMessage(err) };
        } finally { setLoading(false); }
    }, [persist]);

    // ── Student registration ───────────────────────────────────────────────
    const registerStudent = useCallback(async (formData) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/student-register', formData);
            persist(data);
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || (err.code === 'ERR_NETWORK' ? getLoginErrorMessage(err) : 'Registration failed');
            return { success: false, message: msg };
        } finally { setLoading(false); }
    }, []); // eslint-disable-line



    const isAdmin = user?.role === 'admin';
    const isStudent = user?.role === 'student';
    const isFaculty = user?.role === 'faculty';
    const isDomainHead = user?.role === 'domain_head';
    const isDean = user?.role === 'dean';
    const isPrincipal = user?.role === 'principal';

    const value = {
        user, token, loading,
        login, studentLogin, adminLogin,
        registerStudent, logout,
        isAdmin, isStudent, isFaculty, isDomainHead, isDean, isPrincipal, isHod: user?.role === 'hod',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
            <GlobalToast 
                notification={toastNotification} 
                onClose={() => setToastNotification(null)} 
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
