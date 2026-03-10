import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../api/axios';
import GlobalToast from '../components/GlobalToast';

const AuthContext = createContext();

const getKeys = () => {
    const isLocalAdmin = window.location.pathname.startsWith('/admin');
    const prefix = isLocalAdmin ? 'admin_' : 'campuslens_';
    return {
        TOKEN: `${prefix}auth_token`,
        USER: `${prefix}auth_user`,
        isLocalAdmin
    };
};

// Shared error message extraction so "Login failed" is replaced with actionable messages
const getLoginErrorMessage = (err) => {
    if (err.response?.data?.message) return err.response.data.message;
    if (err.response?.data?.error) return String(err.response.data.error);
    if (err.code === 'ERR_NETWORK') return 'Cannot reach server. Is the backend running at http://localhost:5000?';
    if (err.message) return err.message;
    return 'Login failed';
};

export const AuthProvider = ({ children }) => {
    // State for token & user
    const [token, setToken] = useState(() => {
        const { TOKEN } = getKeys();
        return localStorage.getItem(TOKEN) || sessionStorage.getItem(TOKEN);
    });
    const [user, setUser] = useState(() => {
        const { USER } = getKeys();
        const stored = localStorage.getItem(USER) || sessionStorage.getItem(USER);
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const [loading, setLoading] = useState(() => {
        const { TOKEN } = getKeys();
        const storedToken = localStorage.getItem(TOKEN) || sessionStorage.getItem(TOKEN);
        return !!storedToken;
    });

    // Toast Notification State
    const [toastNotification, setToastNotification] = useState(null);
    const lastMessageRef = useRef(null);

    // ── Logout ─────────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        const { TOKEN, USER } = getKeys();
        
        sessionStorage.removeItem(TOKEN);
        sessionStorage.removeItem(USER);
        localStorage.removeItem(TOKEN);
        localStorage.removeItem(USER);
        setToken(null);
        setUser(null);
    }, []);

    // ── Shared helper to persist auth state (isolated by portal/role) ────
    const persist = useCallback((data) => {
        const { TOKEN, USER } = getKeys();
        
        // ALWAYS use localStorage as prioritized by the user for persistence
        localStorage.setItem(TOKEN, data.token);
        localStorage.setItem(USER, JSON.stringify(data.user));
        
        // Also sync state
        setToken(data.token);
        setUser(data.user);
    }, []);

    // ── Verify session on load ──────────────────────────────────────────────
    useEffect(() => {
        const verifySession = async () => {
            const { TOKEN, USER } = getKeys();
            const storedToken = localStorage.getItem(TOKEN) || sessionStorage.getItem(TOKEN);
            if (!storedToken) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await api.get('/auth/me');
                if (data.success) {
                    setUser(data.user);
                    setToken(storedToken);
                    
                    sessionStorage.setItem(USER, JSON.stringify(data.user));
                    localStorage.setItem(USER, JSON.stringify(data.user));
                }
            } catch (err) {
                console.error("Session verification failed:", err.message);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    logout();
                }
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
                            const senderName = latestMessage.sender?.name || latestMessage.senderRole.toUpperCase();
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
