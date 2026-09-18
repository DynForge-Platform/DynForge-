import { useState } from 'react';
import { Outlet, NavLink, useNavigate, ScrollRestoration } from 'react-router';
import {
  CalendarCheck, Wallet, AlertTriangle, User, Settings,
  LayoutDashboard, ShieldCheck, Calendar, Clock, TrendingUp,
  BadgeCheck, Users, FileText, BarChart3, CreditCard,
  LogOut, BookMarked, MessageSquare, Tag, Video, Menu, X,
} from 'lucide-react';
import { Logo } from '../Logo';
import { cn } from '../ui/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { GlobalAiChatbot } from '../GlobalAiChatbot';

type Role = 'student' | 'teacher' | 'admin';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ElementType;
  end?: boolean;
}

const studentNav: NavItem[] = [
  { to: '/dashboard',          labelKey: 'mySessions',          icon: CalendarCheck, end: true },
  { to: '/dashboard/wallet',   labelKey: 'walletTransactions',   icon: Wallet },
  { to: '/messages',           labelKey: 'messages',             icon: MessageSquare },
  { to: '/dashboard/disputes', labelKey: 'disputesComplaints',   icon: AlertTriangle },
  { to: '/dashboard/profile',  labelKey: 'profile',              icon: User },
  { to: '/dashboard/settings', labelKey: 'settings',             icon: Settings },
];

const teacherNav: NavItem[] = [
  { to: '/mentor/dashboard',     labelKey: 'teachingDashboard', icon: LayoutDashboard, end: true },
  { to: '/mentor/sessions',      labelKey: 'mySessionsMentor',  icon: CalendarCheck },
  { to: '/mentor/calendar',      labelKey: 'calendar',          icon: Calendar },
  { to: '/mentor/availability',  labelKey: 'availability',      icon: Clock },
  { to: '/mentor/messages',      labelKey: 'messages',          icon: MessageSquare },
  { to: '/mentor/earnings',      labelKey: 'earnings',          icon: TrendingUp },
  { to: '/mentor/vouchers',      labelKey: 'vouchers',          icon: Tag },
  { to: '/mentor/disputes',      labelKey: 'disputes',          icon: AlertTriangle },
  { to: '/mentor/profile',       labelKey: 'profile',           icon: User },
  { to: '/mentor/verification',  labelKey: 'verification',      icon: BadgeCheck },
  { to: '/mentor/settings',      labelKey: 'settings',          icon: Settings },
];

const adminNav: NavItem[] = [
  { to: '/admin/dashboard',           labelKey: 'dashboard',           icon: LayoutDashboard, end: true },
  { to: '/admin/users',               labelKey: 'users',               icon: Users },
  { to: '/admin/mentors',             labelKey: 'mentors',             icon: User },
  { to: '/admin/mentor-verification', labelKey: 'mentorVerification',  icon: ShieldCheck },
  { to: '/admin/transactions',        labelKey: 'transactions',        icon: CreditCard },
  { to: '/admin/commission-revenue',  labelKey: 'commissionRevenue',   icon: TrendingUp },
  { to: '/admin/payouts',             labelKey: 'payoutsRefunds',      icon: Wallet },
  { to: '/admin/vouchers',            labelKey: 'adminVouchers',       icon: Tag },
  { to: '/admin/disputes',            labelKey: 'adminDisputes',       icon: AlertTriangle },
  { to: '/admin/recordings',          labelKey: 'recordings',          icon: Video },
  { to: '/admin/resources',           labelKey: 'adminResources',      icon: BookMarked },
  { to: '/admin/reports',             labelKey: 'reports',             icon: BarChart3 },
  { to: '/admin/settings',            labelKey: 'settings',            icon: Settings },
  { to: '/admin/audit-logs',          labelKey: 'auditLogs',           icon: FileText },
];

const roleNavMap: Record<Role, NavItem[]> = {
  student: studentNav,
  teacher: teacherNav,
  admin: adminNav,
};

const fallbackAvatar: Record<Role, string> = {
  student: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
  teacher: 'https://images.unsplash.com/photo-1531427888099-b3ecff6e1a6f?auto=format&fit=crop&w=80&q=80',
  admin: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
};

export function DashboardLayout({ role = 'student' }: { role?: Role }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { T } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = roleNavMap[role];

  const userLabel = user?.name ?? 'Guest';
  const avatar = user?.avatar || fallbackAvatar[role];

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
    navigate('/');
  };

  const portalLabel =
    role === 'teacher' ? T.mentorPortal
    : role === 'admin' ? T.adminConsole
    : T.studentWorkspace;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Sidebar (Desktop Dark Glass Panel) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/90 px-4 py-5 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <Logo light />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const label = (T as Record<string, string>)[item.labelKey] ?? item.labelKey;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-cyan-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <Icon className="size-4.5 shrink-0" />
                {label}
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut className="size-4.5" /> {T.logOut}
        </button>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[80vw] flex-col border-r border-slate-800 bg-slate-900 px-5 py-6 shadow-2xl">
            <div className="flex items-center justify-between px-1">
              <Logo light />
              <button
                onClick={() => setMobileNavOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
              {nav.map((item) => {
                const Icon = item.icon;
                const label = (T as Record<string, string>)[item.labelKey] ?? item.labelKey;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )
                    }
                  >
                    <Icon className="size-4.5 shrink-0" />
                    {label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-3 px-2 mb-3">
                <ImageWithFallback
                  src={avatar}
                  alt={userLabel}
                  className="size-9 rounded-full object-cover border border-slate-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{userLabel}</p>
                  <p className="truncate text-xs text-cyan-400 capitalize">{role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors"
              >
                <LogOut className="size-4.5" /> {T.logOut}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 sm:px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 lg:hidden hover:bg-white/10"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-cyan-400">
              {portalLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="hidden text-sm font-medium text-slate-200 sm:inline">
              {userLabel}
            </span>
            <ImageWithFallback
              src={avatar}
              alt={userLabel}
              className="size-8 sm:size-9 rounded-full object-cover border border-slate-700"
            />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <GlobalAiChatbot />
      <ScrollRestoration />
    </div>
  );
}
