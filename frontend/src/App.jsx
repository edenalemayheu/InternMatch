/**
 * App.jsx — root router, providers, route guards.
 *
 * Routes per pages.md spec:
 *   /                    Public          Landing (UNCHANGED)
 *   /signup              Public          Signup (?role=student|company)
 *   /login               Public          Login
 *   /onboarding          Auth (no profile) Onboarding
 *   /dashboard           Student|Company   Role-based dashboard
 *   /postings            Student           Browse postings
 *   /rank                Student           Ranking
 *   /company/postings    Company           Manage postings
 *   /company/applicants/:postingId  Company  Applicants
 *   /company/interviews/:postingId  Company  Interviews / final ranking
 *   /reveal              Student|Company   Match results
 *   /admin               Admin             Admin panel
 */
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';

import { AuthProvider, useAuth }   from './context/AuthContext.jsx';
import { RoundProvider }           from './context/RoundContext.jsx';
import { ToastProvider }           from './context/ToastContext.jsx';
import AppNavbar from './components/AppNavbar.jsx';
import DemoPanel from './components/DemoPanel.jsx';
import Spinner   from './components/ui/Spinner.jsx';

// Landing stays as-is
import Landing from './pages/Landing.jsx';

// New pages — lazy for code splitting
const Login       = lazy(() => import('./pages/Login.jsx'));
const Signup      = lazy(() => import('./pages/Signup.jsx'));
const Onboarding  = lazy(() => import('./pages/Onboarding.jsx'));
const NotFound    = lazy(() => import('./pages/NotFound.jsx'));

const StudentDashboard = lazy(() => import('./pages/student/Dashboard.jsx'));
const StudentPostings  = lazy(() => import('./pages/student/Postings.jsx'));
const StudentRank      = lazy(() => import('./pages/student/Rank.jsx'));
const StudentReveal    = lazy(() => import('./pages/Reveal.jsx'));

const CompanyDashboard = lazy(() => import('./pages/company/Dashboard.jsx'));
const CompanyPostings  = lazy(() => import('./pages/company/Postings.jsx'));
const CompanyApplicants = lazy(() => import('./pages/company/Applicants.jsx'));
const CompanyInterviews = lazy(() => import('./pages/company/Interviews.jsx'));

const AdminPanel = lazy(() => import('./pages/admin/AdminPanel.jsx'));

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <Spinner size={32} />
    </div>
  );
}

// ── Route guards ──────────────────────────────────────────────────────────────
function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingFallback />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;

  if (!user.hasProfile && !user.is_admin && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (role === 'student' && !user.is_admin && user.role !== 'student') {
    return <Navigate to="/dashboard" replace />;
  }
  if (role === 'company' && !user.is_admin && user.role !== 'company') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  if (!user?.is_admin) return <Navigate to="/login" replace />;
  return children;
}

function RedirectByRole() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  if (!user)   return <Navigate to="/login" replace />;
  if (user.is_admin) return <Navigate to="/admin" replace />;
  if (!user.hasProfile) return <Navigate to="/onboarding" replace />;
  return user.role === 'student'
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/dashboard" replace />;
}

// ── Layout (with navbar) ──────────────────────────────────────────────────────
function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <AppNavbar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

// ── Inner app ─────────────────────────────────────────────────────────────────
function InnerApp() {
  const location = useLocation();
  const isPublic = ['/', '/login', '/signup'].some(p => location.pathname === p || location.pathname.startsWith('/signup'));

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public — no navbar */}
          <Route path="/"       element={<Landing />} />
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Onboarding — navbar but simple */}
          <Route path="/onboarding" element={
            <RequireAuth>
              <AppLayout><Onboarding /></AppLayout>
            </RequireAuth>
          } />

          {/* Student pages */}
          <Route path="/dashboard" element={
            <RequireAuth>
              <AppLayout>
                {/* Render student or company dashboard based on role */}
                <RoleBasedDashboard />
              </AppLayout>
            </RequireAuth>
          } />

          <Route path="/postings" element={
            <RequireAuth role="student">
              <AppLayout><StudentPostings /></AppLayout>
            </RequireAuth>
          } />

          <Route path="/rank" element={
            <RequireAuth role="student">
              <AppLayout><StudentRank /></AppLayout>
            </RequireAuth>
          } />

          <Route path="/reveal" element={
            <RequireAuth>
              <AppLayout><StudentReveal /></AppLayout>
            </RequireAuth>
          } />

          {/* Company pages */}
          <Route path="/company/postings" element={
            <RequireAuth role="company">
              <AppLayout><CompanyPostings /></AppLayout>
            </RequireAuth>
          } />

          <Route path="/company/applicants/:postingId" element={
            <RequireAuth role="company">
              <AppLayout><CompanyApplicants /></AppLayout>
            </RequireAuth>
          } />

          <Route path="/company/interviews/:postingId" element={
            <RequireAuth role="company">
              <AppLayout><CompanyInterviews /></AppLayout>
            </RequireAuth>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <RequireAdmin>
              <AppLayout><AdminPanel /></AppLayout>
            </RequireAdmin>
          } />

          {/* Redirects from old routes */}
          <Route path="/student"           element={<Navigate to="/dashboard" replace />} />
          <Route path="/student/postings"  element={<Navigate to="/postings" replace />} />
          <Route path="/student/ranking"   element={<Navigate to="/rank" replace />} />

          {/* 404 */}
          <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
        </Routes>
      </Suspense>

      {/* Demo panel — shown after login */}
      <DemoPanelIfLoggedIn />
    </>
  );
}

function RoleBasedDashboard() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.is_admin) return <Navigate to="/admin" replace />;
  if (user.role === 'company') return <CompanyDashboard />;
  return <StudentDashboard />;
}

function DemoPanelIfLoggedIn() {
  const { user } = useAuth();
  if (!user) return null;
  return <DemoPanel />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoundProvider>
          <ToastProvider>
            <InnerApp />
          </ToastProvider>
        </RoundProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
