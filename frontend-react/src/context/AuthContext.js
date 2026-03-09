import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../api/axios';
import GlobalToast from '../components/GlobalToast';

const AuthContext = createContext();

// ── Portal Mapping Helpers ────────────────────────────────────────────────
const getContextFromRole = (role) => {
    if (role === 'admin') return 'admin';
    if (role === 'student') return 'student';
    if (role === 'faculty') return 'faculty';
    if (role === 'hod') return 'hod';
    if (['principal', 'dean'].includes(role)) return 'principal';
    if (role === 'domain_head') return 'incharge';
    return 'general';
};

const getPortalContext = () => {
    const path = window.location.pathname.toLowerCase();
    
    // Check for dashboard/home paths
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/student')) return 'student';
    if (path.startsWith('/faculty')) return 'faculty';
    if (path.startsWith('/hod')) return 'hod';
    if (path.startsWith('/principal') || path.startsWith('/monitor') || path.includes('principal')) return 'principal';
    if (path.startsWith('/domain-head') || path.includes('incharge') || path.includes('-dashboard')) return 'incharge';
    
    // Check for login paths to enable session restoration on login screens
    if (path.includes('/login/student') || path.includes('/student-login') || path.includes('/student/login')) return 'student';
    if (path.includes('/admin/login')) return 'admin';
    if (path.includes('/login/faculty') || path.includes('/faculty/login')) return 'faculty';
    if (path.includes('/login/principal')) return 'principal';
    if (path.includes('/login/hod')) return 'hod';
    if (path.includes('/login/incharge') || path.includes('incharge-login')) return 'incharge';
    
    return 'general';
};

const getKeys = (overrideRole = null) => {
    const ctx = overrideRole ? getContextFromRole(overrideRole) : getPortalContext();
    return {
        TOKEN: `${ctx}_auth_token`,
        USER: `${ctx}_auth_user`
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
        // Use generic logout (clears based on current URL)
        const { TOKEN, USER } = getKeys();
        
        // Also try to clear based on current user role if we have it in state
        const roleCtx = user?.role ? getContextFromRole(user.role) : null;
        if (roleCtx) {
            sessionStorage.removeItem(`${roleCtx}_auth_token`);
            sessionStorage.removeItem(`${roleCtx}_auth_user`);
            localStorage.removeItem(`${roleCtx}_auth_token`);
            localStorage.removeItem(`${roleCtx}_auth_user`);
        }

        sessionStorage.removeItem(TOKEN);
        sessionStorage.removeItem(USER);
        localStorage.removeItem(TOKEN);
        localStorage.removeItem(USER);
        setToken(null);
        setUser(null);
    }, [user]);

    // ── Shared helper to persist auth state (isolated by portal/role) ────
    const persist = (data) => {
        // Use the role from the server response to determine the correct namespace
        const { TOKEN, USER } = getKeys(data.user.role);
        
        // ALWAYS use localStorage as prioritized by the user for persistence
        localStorage.setItem(TOKEN, data.token);
        localStorage.setItem(USER, JSON.stringify(data.user));
        
        // Also sync state
        setToken(data.token);
        setUser(data.user);
    };

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
    }, [token, user]);

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

    // ── Faculty login ──────────────────────────────────────────────────────
    const facultyLogin = useCallback(async (email, password, facultyId = '') => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/faculty-login', { email, password, facultyId });
            persist(data);
            return { success: true, role: data.user.role };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Login failed' };
        } finally { setLoading(false); }
    }, []); // eslint-disable-line

    // ── Unified Faculty & HOD login ────────────────────────────────────────
    const unifiedFacultyHodLogin = useCallback(async (email, password, departmentCode = '') => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/faculty-hod-login', { email, password, departmentCode });
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
    }, []); // eslint-disable-line

    // ── Domain Head login (General) ────────────────────────────────────────
    const domainHeadLogin = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/domain-head-login', { email, password });
            persist(data);
            return { success: true, role: data.user.role, assignedDomain: data.user.assignedDomain };
        } catch (err) {
            return { success: false, message: getLoginErrorMessage(err) };
        } finally { setLoading(false); }
    }, []); // eslint-disable-line

    // ── Transport Incharge login ───────────────────────────────────────────
    const transportInchargeLogin = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login/transport-incharge', { email, password });
            persist(data);
            return { success: true, role: data.user.role, assignedDomain: data.user.assignedDomain };
        } catch (err) {
            return { success: false, message: getLoginErrorMessage(err) };
        } finally { setLoading(false); }
    }, []); // eslint-disable-line

    // ── Mess Incharge login ────────────────────────────────────────────────
    const messInchargeLogin = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login/mess-incharge', { email, password });
            persist(data);
            return { success: true, role: data.user.role, assignedDomain: data.user.assignedDomain };
        } catch (err) {
            return { success: false, message: getLoginErrorMessage(err) };
        } finally { setLoading(false); }
    }, []); // eslint-disable-line

    // ── Sanitation Incharge login ──────────────────────────────────────────
    const sanitationInchargeLogin = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login/sanitation-incharge', { email, password });
            persist(data);
            return { success: true, role: data.user.role, assignedDomain: data.user.assignedDomain };
        } catch (err) {
            return { success: false, message: getLoginErrorMessage(err) };
        } finally { setLoading(false); }
    }, []); // eslint-disable-line

    // ── Hostel Incharge login ──────────────────────────────────────────────
    const hostelInchargeLogin = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login/hostel-incharge', { email, password });
            persist(data);
            return { success: true, role: data.user.role, assignedDomain: data.user.assignedDomain };
        } catch (err) {
            return { success: false, message: getLoginErrorMessage(err) };
        } finally { setLoading(false); }
    }, []); // eslint-disable-line

    // ── HOD login ──────────────────────────────────────────────────────────
    const hodLogin = useCallback(async (email, password, hodId = '', department = '') => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/hod-login', { email, password, hodId, department });
            persist(data);
            return { success: true, role: data.user.role, department: data.user.department };
        } catch (err) {
            return { success: false, message: getLoginErrorMessage(err) };
        } finally { setLoading(false); }
    }, []); // eslint-disable-line

    // ── Dean / Principal login ─────────────────────────────────────────────
    const monitorLogin = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/monitor-login', { email, password });
            persist(data);
            return { success: true, role: data.user.role };
        } catch (err) {
            return { success: false, message: getLoginErrorMessage(err) };
        } finally { setLoading(false); }
    }, []); // eslint-disable-line

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
        login, studentLogin, facultyLogin, unifiedFacultyHodLogin, adminLogin,
        domainHeadLogin, transportInchargeLogin, messInchargeLogin, sanitationInchargeLogin, hostelInchargeLogin, hodLogin,
        monitorLogin,
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
