import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FiAlertCircle } from 'react-icons/fi';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MessageNotifier from './components/MessageNotifier';

// ── Lazy-loaded Public Pages ─────────────────────────────────────────────────
const Login = lazy(() => import('./pages/Login'));
const StudentRegister = lazy(() => import('./pages/StudentRegister'));

// ── Lazy-loaded Admin Pages ──────────────────────────────────────────────────
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const FacultyAnalytics = lazy(() => import('./pages/admin/FacultyAnalytics'));
const FacultyManagement = lazy(() => import('./pages/admin/FacultyManagement'));
const SubjectManagement = lazy(() => import('./pages/admin/SubjectManagement'));
const StudentsPage = lazy(() => import('./pages/admin/StudentsPage'));
const DomainOverview = lazy(() => import('./pages/admin/DomainOverview'));
const DomainHeadManagement = lazy(() => import('./pages/admin/DomainHeadManagement'));
const NotificationCenter = lazy(() => import('./pages/admin/NotificationCenter'));
const AdminDomainDashboard = lazy(() => import('./pages/admin/AdminDomainDashboard'));
const HodManagement = lazy(() => import('./pages/admin/HodManagement'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));

// ── Lazy-loaded Student Pages ────────────────────────────────────────────────
const StudentHome = lazy(() => import('./pages/student/StudentHome'));
const FeedbackForm = lazy(() => import('./pages/student/FeedbackForm'));
const DomainFeedback = lazy(() => import('./pages/student/DomainFeedback'));
const StudentQueries = lazy(() => import('./pages/student/StudentQueries'));

// ── Lazy-loaded HOD Pages ────────────────────────────────────────────────────
const HodDashboard = lazy(() => import('./pages/hod/HodDashboard'));

// ── Lazy-loaded Domain Head Pages ────────────────────────────────────────────
const DomainHeadDashboard = lazy(() => import('./pages/domain-head/DomainHeadDashboard'));
const DomainHeadFeedback = lazy(() => import('./pages/domain-head/DomainHeadFeedback'));
const DomainHeadNotifications = lazy(() => import('./pages/domain-head/DomainHeadNotifications'));
const DomainHeadIssues = lazy(() => import('./pages/domain-head/DomainHeadIssues'));
const DomainHeadQueries = lazy(() => import('./pages/domain-head/DomainHeadQueries'));

// ── Lazy-loaded Monitor/Principal Pages ──────────────────────────────────────
const PrincipalDashboard = lazy(() => import('./pages/monitor/PrincipalDashboard'));
const MonitorDomains = lazy(() => import('./pages/monitor/MonitorDomains'));
const MonitorIssues = lazy(() => import('./pages/monitor/MonitorIssues'));

// ── Lazy-loaded Shared Pages ─────────────────────────────────────────────────
const MessagesPage = lazy(() => import('./pages/MessagesPage'));

// ── Global Loading Fallback ──────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    flexDirection: 'column',
    gap: '1rem',
    background: 'var(--clr-surface, #f8fafc)'
  }}>
    <div className="spinner" style={{ width: 36, height: 36 }} />
    <p style={{ color: 'var(--clr-text-3, #94a3b8)', fontSize: '0.875rem', fontWeight: 600 }}>
      Loading...
    </p>
  </div>
);

const Unauthorized = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
    <FiAlertCircle size={52} style={{ color: 'var(--clr-primary)' }} />
    <h2 style={{ color: 'var(--clr-danger)' }}>Access Denied</h2>
    <p style={{ color: 'var(--clr-text-3)' }}>You don't have permission to view this page.</p>
    <a href="/login" className="btn btn-primary">&larr; Back to Login</a>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <MessageNotifier />
          <Routes>
            {/* ── Public routes ──────────────────────────────────────── */}
            <Route path="/login" element={<Login />} />
            <Route path="/student-register" element={<StudentRegister />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* ── Admin protected routes ─────────────────────────────── */}
            <Route path="/admin" element={<Navigate to="/admin/domain-overview" replace />} />
            <Route path="/admin/faculty" element={<ProtectedRoute role="admin"><FacultyAnalytics /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute role="admin"><StudentsPage /></ProtectedRoute>} />
            <Route path="/admin/users-management" element={<ProtectedRoute role="admin"><UsersPage /></ProtectedRoute>} />
            <Route path="/admin/faculty-management" element={<ProtectedRoute role="admin"><FacultyManagement /></ProtectedRoute>} />
            <Route path="/admin/subjects-management" element={<ProtectedRoute role="admin"><SubjectManagement /></ProtectedRoute>} />
            <Route path="/admin/domain-overview" element={<ProtectedRoute role="admin"><DomainOverview /></ProtectedRoute>} />
            <Route path="/admin/domain/:domainSlug" element={<ProtectedRoute role="admin"><AdminDomainDashboard /></ProtectedRoute>} />
            <Route path="/admin/domain-heads" element={<ProtectedRoute role="admin"><DomainHeadManagement /></ProtectedRoute>} />
            <Route path="/admin/hod-management" element={<ProtectedRoute role="admin"><HodManagement /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><NotificationCenter /></ProtectedRoute>} />

            {/* ── Student protected routes ───────────────────────────── */}
            <Route path="/student/home" element={<ProtectedRoute role="student"><StudentHome /></ProtectedRoute>} />
            <Route path="/student/feedback/:subjectId" element={<ProtectedRoute role="student"><FeedbackForm /></ProtectedRoute>} />
            <Route path="/student/domain-feedback" element={<ProtectedRoute role="student"><DomainFeedback /></ProtectedRoute>} />
            <Route path="/student/queries" element={<ProtectedRoute role="student"><StudentQueries /></ProtectedRoute>} />

            {/* ── HOD protected routes ───────────────────────────────── */}
            <Route path="/hod/dashboard" element={<ProtectedRoute role="hod"><HodDashboard /></ProtectedRoute>} />

            {/* ── Domain Head protected routes ───────────────────────── */}
            <Route path="/domain-head/dashboard" element={<ProtectedRoute role="domain_head"><DomainHeadDashboard /></ProtectedRoute>} />
            <Route path="/transport-dashboard" element={<ProtectedRoute role="domain_head"><DomainHeadDashboard /></ProtectedRoute>} />
            <Route path="/mess-dashboard" element={<ProtectedRoute role="domain_head"><DomainHeadDashboard /></ProtectedRoute>} />
            <Route path="/hostel-dashboard" element={<ProtectedRoute role="domain_head"><DomainHeadDashboard /></ProtectedRoute>} />
            <Route path="/sanitation-dashboard" element={<ProtectedRoute role="domain_head"><DomainHeadDashboard /></ProtectedRoute>} />
            <Route path="/domain-head/feedback" element={<ProtectedRoute role="domain_head"><DomainHeadFeedback /></ProtectedRoute>} />
            <Route path="/domain-head/notifications" element={<ProtectedRoute role="domain_head"><DomainHeadNotifications /></ProtectedRoute>} />
            <Route path="/domain-head/issues" element={<ProtectedRoute role="domain_head"><DomainHeadIssues /></ProtectedRoute>} />
            <Route path="/domain-head/queries" element={<ProtectedRoute role="domain_head"><DomainHeadQueries /></ProtectedRoute>} />

            {/* ── Principal protected routes ─────────────────────────── */}
            <Route path="/principal/dashboard" element={<ProtectedRoute role={['principal', 'dean']}><PrincipalDashboard /></ProtectedRoute>} />
            <Route path="/monitor/domains" element={<ProtectedRoute role={['principal', 'dean']}><MonitorDomains /></ProtectedRoute>} />
            <Route path="/monitor/issues" element={<ProtectedRoute role={['principal', 'dean']}><MonitorIssues /></ProtectedRoute>} />

            {/* ── Shared protected routes ────────────────────────────── */}
            <Route path="/messages" element={<ProtectedRoute role={['admin', 'principal', 'hod', 'faculty', 'domain_head', 'dean']}><MessagesPage /></ProtectedRoute>} />

            {/* Default: send to unified login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
