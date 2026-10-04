import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link, ScrollRestoration } from 'react-router';
import {
  CalendarCheck, Wallet, AlertTriangle, User, Settings,
  LayoutDashboard, ShieldCheck, Calendar, Clock, TrendingUp,
  BadgeCheck, Users, FileText, BarChart3, CreditCard,
  LogOut, BookMarked, MessageSquare, Tag, Video, Menu, X,
  GraduationCap, Plus, Sparkles, ExternalLink, ChevronRight
} from 'lucide-react';
import { Logo } from '../Logo';
import { cn } from '../ui/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getMe, type UserProfile } from '../../services/userService';
import { formatCurrency } from '../../data/mockData';
import { toast } from 'sonner';

type Role = 'student' | 'teacher' | 'admin';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ElementType;
  end?: boolean;
  badge?: string;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { T } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = roleNavMap[role];

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((data) => {
        if (mounted) setProfile(data);
      })
      .catch(() => {
        // Fallback or unauthenticated
      });
    return () => { mounted = false; };
  }, [user?.id]);

  const userLabel = profile?.fullName || user?.name || 'Học viên';
  const avatar = profile?.avatarUrl || user?.avatar || fallbackAvatar[role];
  const walletBalance = profile?.walletBalance ?? 0;

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
    navigate('/');
  };

  const portalLabel =
    role === 'teacher' ? (T.mentorPortal ?? 'Mentor Portal')
    : role === 'admin' ? (T.adminConsole ?? 'Admin Console')
    : (T.studentWorkspace ?? 'Student Workspace');

  const portalBadge =
    role === 'teacher' ? 'Mentor'
    : role === 'admin' ? 'Admin'
    : 'Mentee';

  return (
    <div className="flex min-h-screen bg-[#020b18] text-slate-100 selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient gradient glow circles */}
      <div className="pointer-events-none fixed -top-40 -left-40 size-96 rounded-full bg-cyan-600/10 blur-[130px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 size-[32rem] rounded-full bg-indigo-600/10 blur-[150px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/4 size-96 rounded-full bg-blue-600/10 blur-[130px]" />

      {/* Sidebar (Desktop Dark Glass Panel with Cyber-Academic Accents) */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950/70 px-4 py-5 backdrop-blur-2xl lg:flex z-30">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pb-4 border-b border-slate-800/60">
          <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
            <Logo light />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-cyan-300 uppercase">
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {portalBadge}
          </span>
        </div>

        {/* User quick badge inside sidebar */}
        <div className="mt-4 mx-1 rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/60 to-slate-900/30 p-3 backdrop-blur-md shadow-inner">
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0">
              <ImageWithFallback
                src={avatar}
                alt={userLabel}
                className="size-10 rounded-xl object-cover ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-slate-950"
              />
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-slate-950 bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white tracking-tight">{userLabel}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                {profile?.universityName ? (
                  <span className="truncate text-cyan-400 flex items-center gap-1">
                    <GraduationCap className="size-3 shrink-0" />
                    {profile.universityCode || profile.universityName}
                  </span>
                ) : (
                  <span className="text-slate-400 capitalize">{role}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Wallet Bar in Sidebar (for students) */}
          {role === 'student' && (
            <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ví Ký Quỹ</span>
                <p className="text-xs font-bold text-emerald-400 tracking-tight">{formatCurrency(walletBalance)}</p>
              </div>
              <Link
                to="/dashboard/wallet"
                className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all hover:scale-105"
              >
                <Plus className="size-3" /> Nạp tiền
              </Link>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="mt-4 flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          <div className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Điều hướng
          </div>
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
                    'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent text-cyan-300 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.12)] font-semibold translate-x-1'
                      : 'text-slate-300 hover:bg-slate-900/60 hover:text-white hover:border-slate-800 border border-transparent'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex size-8 items-center justify-center rounded-lg transition-colors',
                    'bg-slate-900/80 border border-slate-800 text-slate-300 group-hover:border-cyan-500/30 group-hover:text-cyan-400 group-hover:bg-cyan-950/20'
                  )}>
                    <Icon className="size-4 shrink-0" />
                  </span>
                  <span>{label}</span>
                </div>
                <ChevronRight className="size-3.5 opacity-0 -translate-x-1 text-cyan-400/70 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Action */}
        <div className="mt-auto pt-3 border-t border-slate-800/80 flex flex-col gap-2">
          <Link
            to="/mentors"
            className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 to-indigo-950/30 px-3.5 py-2 text-xs font-medium text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-950/40 transition-all"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-cyan-400" />
              Khám phá Mentor mới
            </span>
            <ExternalLink className="size-3 opacity-60" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-400 hover:bg-red-950/30 hover:text-red-400 hover:border hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="size-4" /> {T.logOut ?? 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-950 px-5 py-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between px-1 pb-4 border-b border-slate-800">
              <Logo light />
              <button
                onClick={() => setMobileNavOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="mt-5 flex flex-1 flex-col gap-1.5 overflow-y-auto">
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
                          ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-lg'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
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
                  className="size-10 rounded-full object-cover border border-slate-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{userLabel}</p>
                  <p className="truncate text-xs text-cyan-400 capitalize">{portalLabel}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors"
              >
                <LogOut className="size-4.5" /> {T.logOut ?? 'Đăng xuất'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Area */}
      <div className="flex min-w-0 flex-1 flex-col z-10">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-4 sm:px-8 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 lg:hidden hover:bg-white/10"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            
            {/* Breadcrumb / Title display */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block size-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {portalLabel}
              </span>
              {profile?.universityName && (
                <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-0.5 text-xs text-slate-300">
                  <GraduationCap className="size-3 text-cyan-400" />
                  {profile.universityName}
                </span>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Live Wallet Pill (Student) */}
            {role === 'student' && (
              <Link
                to="/dashboard/wallet"
                className="group flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-1.5 transition-all hover:bg-emerald-950/40 hover:border-emerald-500/50 hover:scale-[1.02]"
                title="Quản lý ví và nạp tiền"
              >
                <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Ví:</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-400 tracking-tight">
                  {formatCurrency(walletBalance)}
                </span>
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                  <Plus className="size-3" />
                </span>
              </Link>
            )}

            <LanguageSwitcher />

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            {/* Profile Avatar & Info */}
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2.5 rounded-xl p-1 transition-all hover:bg-slate-900/60 group"
            >
              <div className="relative">
                <ImageWithFallback
                  src={avatar}
                  alt={userLabel}
                  className="size-8 sm:size-9 rounded-full object-cover ring-2 ring-cyan-500/30 group-hover:ring-cyan-400 transition-all"
                />
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-slate-950 bg-emerald-500" />
              </div>
              <div className="hidden text-left lg:block">
                <p className="truncate text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {userLabel}
                </p>
                <p className="text-[10px] text-slate-400 capitalize leading-none">
                  {portalBadge}
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <ScrollRestoration />
    </div>
  );
}
