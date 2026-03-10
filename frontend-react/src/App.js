import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FiAlertCircle } from 'react-icons/fi';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Login from './pages/Login';
import StudentRegister from './pages/StudentRegister';
import AdminLogin from './pages/AdminLogin';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyAnalytics from './pages/admin/FacultyAnalytics';
import FacultyManagement from './pages/admin/FacultyManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import StudentsPage from './pages/admin/StudentsPage';
import DomainOverview from './pages/admin/DomainOverview';
import DomainHeadManagement from './pages/admin/DomainHeadManagement';
import NotificationCenter from './pages/admin/NotificationCenter';
import AdminDomainDashboard from './pages/admin/AdminDomainDashboard';
import HodManagement from './pages/admin/HodManagement';


// Student pages
import StudentHome from './pages/student/StudentHome';
import FeedbackForm from './pages/student/FeedbackForm';
import DomainFeedback from './pages/student/DomainFeedback';
import StudentQueries from './pages/student/StudentQueries';

// HOD pages
import HodDashboard from './pages/hod/HodDashboard';

// Domain Head pages
import DomainHeadDashboard from './pages/domain-head/DomainHeadDashboard';
import DomainHeadFeedback from './pages/domain-head/DomainHeadFeedback';
import DomainHeadNotifications from './pages/domain-head/DomainHeadNotifications';
import DomainHeadIssues from './pages/domain-head/DomainHeadIssues';

// Monitor pages (Principal)
import PrincipalDashboard from './pages/monitor/PrincipalDashboard';
import MonitorDomains from './pages/monitor/MonitorDomains';
import MonitorIssues from './pages/monitor/MonitorIssues';

// Shared
import MessagesPage from './pages/MessagesPage';

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
        <Routes>
          {/* ── Public routes: single login URL for everyone but admin ─── */}
          <Route path="/login" element={<Login />} />
          <Route path="/student-register" element={<StudentRegister />} />
          
          {/* Admin — /admin/login exclusively */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ── Admin protected routes ────────────────────── */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/faculty" element={<ProtectedRoute role="admin"><FacultyAnalytics /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><StudentsPage /></ProtectedRoute>} />
          <Route path="/admin/faculty-management" element={<ProtectedRoute role="admin"><FacultyManagement /></ProtectedRoute>} />
          <Route path="/admin/subjects-management" element={<ProtectedRoute role="admin"><SubjectManagement /></ProtectedRoute>} />
          <Route path="/admin/domain-overview" element={<ProtectedRoute role="admin"><DomainOverview /></ProtectedRoute>} />
          <Route path="/admin/domain/:domainSlug" element={<ProtectedRoute role="admin"><AdminDomainDashboard /></ProtectedRoute>} />
          <Route path="/admin/domain-heads" element={<ProtectedRoute role="admin"><DomainHeadManagement /></ProtectedRoute>} />
          <Route path="/admin/hod-management" element={<ProtectedRoute role="admin"><HodManagement /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><NotificationCenter /></ProtectedRoute>} />



          {/* ── Student protected routes ──────────────────── */}
          <Route path="/student/home" element={<ProtectedRoute role="student"><StudentHome /></ProtectedRoute>} />
          <Route path="/student/feedback/:subjectId" element={<ProtectedRoute role="student"><FeedbackForm /></ProtectedRoute>} />
          <Route path="/student/domain-feedback" element={<ProtectedRoute role="student"><DomainFeedback /></ProtectedRoute>} />
          <Route path="/student/queries" element={<ProtectedRoute role="student"><StudentQueries /></ProtectedRoute>} />

          {/* ── HOD protected routes ──────────────────────── */}
          <Route path="/hod/dashboard" element={<ProtectedRoute role="hod"><HodDashboard /></ProtectedRoute>} />

          {/* ── Domain Head protected routes ──────────────── */}
          <Route path="/domain-head/dashboard" element={<ProtectedRoute role="domain_head"><DomainHeadDashboard /></ProtectedRoute>} />
          <Route path="/transport-dashboard" element={<ProtectedRoute role="domain_head"><DomainHeadDashboard /></ProtectedRoute>} />
          <Route path="/mess-dashboard" element={<ProtectedRoute role="domain_head"><DomainHeadDashboard /></ProtectedRoute>} />
          <Route path="/hostel-dashboard" element={<ProtectedRoute role="domain_head"><DomainHeadDashboard /></ProtectedRoute>} />
          <Route path="/sanitation-dashboard" element={<ProtectedRoute role="domain_head"><DomainHeadDashboard /></ProtectedRoute>} />
          <Route path="/domain-head/feedback" element={<ProtectedRoute role="domain_head"><DomainHeadFeedback /></ProtectedRoute>} />
          <Route path="/domain-head/notifications" element={<ProtectedRoute role="domain_head"><DomainHeadNotifications /></ProtectedRoute>} />
          <Route path="/domain-head/issues" element={<ProtectedRoute role="domain_head"><DomainHeadIssues /></ProtectedRoute>} />

          {/* ── Principal protected routes ────────── */}
          <Route path="/principal/dashboard" element={<ProtectedRoute role="principal"><PrincipalDashboard /></ProtectedRoute>} />
          <Route path="/monitor/domains" element={<ProtectedRoute role={['principal']}><MonitorDomains /></ProtectedRoute>} />
          <Route path="/monitor/issues" element={<ProtectedRoute role={['principal']}><MonitorIssues /></ProtectedRoute>} />

          {/* ── Shared protected routes ───────────── */}
          <Route path="/messages" element={<ProtectedRoute role={['admin', 'principal', 'hod', 'faculty', 'domain_head', 'dean']}><MessagesPage /></ProtectedRoute>} />

          {/* Default: send to unified login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
