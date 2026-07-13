import { Outlet, NavLink, useNavigate, ScrollRestoration } from 'react-router';
import {
  CalendarCheck, Wallet, AlertTriangle, User, Settings,
  LayoutDashboard, ShieldCheck, Calendar, Clock, TrendingUp,
  BadgeCheck, Users, FileText, BarChart3, CreditCard,
  LogOut, BookMarked, MessageSquare, Tag, Video,
} from 'lucide-react';
import { Logo } from '../Logo';
import { cn } from '../ui/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

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
  { to: '/mentor/wallet',        labelKey: 'walletWithdraw',    icon: Wallet },
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

// Fallback avatar per role when the logged-in user has none.
const fallbackAvatar: Record<Role, string> = {
  student: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
  teacher: 'https://images.unsplash.com/photo-1531427888099-b3ecff6e1a6f?auto=format&fit=crop&w=80&q=80',
  admin: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
};

export function DashboardLayout({ role = 'student' }: { role?: Role }) {
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
    <div className="flex min-h-screen bg-pale-blue">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-white px-4 py-5 lg:flex">
        <div className="px-2">
          <Logo />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-0.5 overflow-y-auto">
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
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )
                }
                style={{ fontWeight: 500 }}
              >
                <Icon className="size-4.5 shrink-0" />
                {label}
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          style={{ fontWeight: 500 }}
        >
          <LogOut className="size-4.5" /> {T.logOut}
        </button>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-white/85 px-6 backdrop-blur">
          <span className="text-sm text-muted-foreground" style={{ fontWeight: 500 }}>
            {portalLabel}
          </span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="hidden text-sm sm:inline" style={{ fontWeight: 500 }}>
              {userLabel}
            </span>
            <ImageWithFallback
              src={avatar}
              alt={userLabel}
              className="size-9 rounded-full object-cover"
            />
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  );
}
