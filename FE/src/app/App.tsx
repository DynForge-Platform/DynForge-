import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { PublicLayout } from './components/layouts/PublicLayout';
import { DashboardLayout } from './components/layouts/DashboardLayout';

// Public pages
import { Home } from './pages/Home';
import { MentorListing } from './pages/MentorListing';
import { MentorProfile } from './pages/MentorProfile';
import { ScheduleConsultation } from './pages/ScheduleConsultation';
import { OrderSummary } from './pages/OrderSummary';
import { EscrowStatus } from './pages/EscrowStatus';
import { BecomeMentor } from './pages/BecomeMentor';
import { Resources } from './pages/Resources';
import { About } from './pages/About';
import { Login, Register } from './pages/Auth';
import { ContactSupport } from './pages/ContactSupport';
import { Messages } from './pages/Messages';

// Error pages
import { NotFoundPage, PermissionDeniedPage, GlobalErrorBoundary } from './pages/ErrorPages';

// Student dashboard
import { StudentDashboard } from './pages/StudentDashboard';
import { DashboardWallet } from './pages/dashboard/DashboardWallet';
import { DashboardDisputes } from './pages/dashboard/DashboardDisputes';
import { DashboardProfile } from './pages/dashboard/DashboardProfile';
import { DashboardSettings } from './pages/dashboard/DashboardSettings';

// Mentor (teacher) portal
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherSessions } from './pages/teacher/TeacherSessions';
import { TeacherCalendar } from './pages/teacher/TeacherCalendar';
import { TeacherAvailability } from './pages/teacher/TeacherAvailability';
import { TeacherEarnings } from './pages/teacher/TeacherEarnings';
import { TeacherWallet } from './pages/teacher/TeacherWallet';
import { TeacherDisputes } from './pages/teacher/TeacherDisputes';
import { TeacherProfile } from './pages/teacher/TeacherProfile';
import { TeacherVerification } from './pages/teacher/TeacherVerification';
import { TeacherSettings } from './pages/teacher/TeacherSettings';
import { MentorWithdraw } from './pages/teacher/MentorWithdraw';
import { MentorUnlockWithdraw } from './pages/teacher/MentorUnlockWithdraw';
import { MentorVouchers } from './pages/teacher/MentorVouchers';

// Admin portal
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminMentors } from './pages/admin/AdminMentors';
import { AdminVerification } from './pages/admin/AdminVerification';
import { AdminTransactions } from './pages/admin/AdminTransactions';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminPayouts } from './pages/admin/AdminPayouts';
import { AdminVouchers } from './pages/admin/AdminVouchers';
import { AdminDisputes } from './pages/admin/AdminDisputes';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

const router = createBrowserRouter([
  // ── Public ──────────────────────────────────────────────────
  {
    element: <PublicLayout />,
    errorElement: <GlobalErrorBoundary />,
    children: [
      { path: '/', element: <Home /> },

      // Mentor discovery — canonical + aliases
      { path: '/mentors', element: <MentorListing /> },
      { path: '/find-mentors', element: <MentorListing /> },

      // Mentor profile — canonical + alias
      { path: '/mentors/:id', element: <MentorProfile /> },
      { path: '/mentor/:id', element: <MentorProfile /> },

      // Booking flow — canonical + aliases
      { path: '/mentors/:id/schedule', element: <ScheduleConsultation /> },
      { path: '/mentors/:id/book', element: <ScheduleConsultation /> },
      { path: '/mentor/:id/book', element: <ScheduleConsultation /> },
      { path: '/mentor/:id/calendar', element: <ScheduleConsultation /> },

      // Order / confirm pay — canonical + aliases
      { path: '/mentors/:id/order', element: <OrderSummary /> },
      { path: '/confirm-pay', element: <OrderSummary /> },
      { path: '/order-summary', element: <OrderSummary /> },

      // Payment status
      { path: '/escrow', element: <EscrowStatus /> },
      { path: '/payment-status', element: <EscrowStatus /> },

      // Other public pages
      { path: '/become-a-mentor', element: <BecomeMentor /> },
      { path: '/resources', element: <Resources /> },
      { path: '/about', element: <About /> },
      { path: '/support/contact', element: <ContactSupport /> },
    ],
  },

  // ── Student dashboard ────────────────────────────────────────
  {
    element: <DashboardLayout role="student" />,
    errorElement: <GlobalErrorBoundary />,
    children: [
      { path: '/dashboard', element: <StudentDashboard /> },
      { path: '/dashboard/sessions', element: <StudentDashboard /> },
      { path: '/messages', element: <Messages /> },
      { path: '/messages/:mentorId', element: <Messages /> },
      { path: '/dashboard/wallet', element: <DashboardWallet /> },
      { path: '/dashboard/disputes', element: <DashboardDisputes /> },
      { path: '/dashboard/profile', element: <DashboardProfile /> },
      { path: '/dashboard/settings', element: <DashboardSettings /> },
    ],
  },

  // ── Mentor portal (/mentor/*) ────────────────────────────────
  {
    element: <DashboardLayout role="teacher" />,
    errorElement: <GlobalErrorBoundary />,
    children: [
      { path: '/mentor/dashboard', element: <TeacherDashboard /> },
      { path: '/mentor/sessions', element: <TeacherSessions /> },
      { path: '/mentor/calendar', element: <TeacherCalendar /> },
      { path: '/mentor/availability', element: <TeacherAvailability /> },
      { path: '/mentor/messages', element: <Messages role="mentor" /> },
      { path: '/mentor/earnings', element: <TeacherEarnings /> },
      { path: '/mentor/wallet', element: <TeacherWallet /> },
      { path: '/mentor/withdraw', element: <MentorWithdraw /> },
      { path: '/mentor/unlock-withdraw', element: <MentorUnlockWithdraw /> },
      { path: '/mentor/vouchers', element: <MentorVouchers /> },
      { path: '/mentor/disputes', element: <TeacherDisputes /> },
      { path: '/mentor/profile', element: <TeacherProfile /> },
      { path: '/mentor/verification', element: <TeacherVerification /> },
      { path: '/mentor/settings', element: <TeacherSettings /> },

      // Legacy /teacher/* → redirect to /mentor/*
      { path: '/teacher', element: <Navigate to="/mentor/dashboard" replace /> },
      { path: '/teacher/sessions', element: <Navigate to="/mentor/sessions" replace /> },
      { path: '/teacher/calendar', element: <Navigate to="/mentor/calendar" replace /> },
      { path: '/teacher/availability', element: <Navigate to="/mentor/availability" replace /> },
      { path: '/teacher/earnings', element: <Navigate to="/mentor/earnings" replace /> },
      { path: '/teacher/wallet', element: <Navigate to="/mentor/wallet" replace /> },
      { path: '/teacher/disputes', element: <Navigate to="/mentor/disputes" replace /> },
      { path: '/teacher/profile', element: <Navigate to="/mentor/profile" replace /> },
      { path: '/teacher/verification', element: <Navigate to="/mentor/verification" replace /> },
      { path: '/teacher/settings', element: <Navigate to="/mentor/settings" replace /> },
    ],
  },

  // ── Admin portal (/admin/*) ──────────────────────────────────
  {
    element: <DashboardLayout role="admin" />,
    errorElement: <GlobalErrorBoundary />,
    children: [
      { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
      { path: '/admin/dashboard', element: <AdminOverview /> },
      { path: '/admin/users', element: <AdminUsers /> },
      { path: '/admin/mentors', element: <AdminMentors /> },
      { path: '/admin/mentor-verification', element: <AdminVerification /> },
      { path: '/admin/transactions', element: <AdminTransactions /> },
      { path: '/admin/commission-revenue', element: <AdminDashboard /> },
      { path: '/admin/payouts', element: <AdminPayouts /> },
      { path: '/admin/vouchers', element: <AdminVouchers /> },
      { path: '/admin/disputes', element: <AdminDisputes /> },
      { path: '/admin/resources', element: <Resources /> },
      { path: '/admin/reports', element: <AdminOverview /> },
      { path: '/admin/settings', element: <DashboardSettings /> },
      { path: '/admin/audit-logs', element: <AdminAuditLogs /> },

      // Legacy aliases
      { path: '/admin/verification', element: <Navigate to="/admin/mentor-verification" replace /> },
      { path: '/admin/commission', element: <Navigate to="/admin/commission-revenue" replace /> },
      { path: '/admin/audit', element: <Navigate to="/admin/audit-logs" replace /> },
    ],
  },

  // ── Auth ─────────────────────────────────────────────────────
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/403', element: <PermissionDeniedPage /> },

  // ── 404 catch-all ────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },
]);

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </LanguageProvider>
  );
}
