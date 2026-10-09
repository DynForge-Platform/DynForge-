import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import {
  Menu, X, ChevronDown, LogOut, LayoutDashboard,
  Home, Search, Sparkles, BookOpen, Info, ChevronRight,
} from 'lucide-react';
import { Logo } from '../Logo';
import { cn } from '../ui/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { toast } from 'sonner';

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { T, lang } = useLanguage();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: lang === 'vi' ? 'Trang chủ' : 'Home', icon: Home },
    { to: '/mentors', label: lang === 'vi' ? 'Tìm gia sư' : 'Find Mentors', icon: Search },
    { to: '/become-a-mentor', label: lang === 'vi' ? 'Trở thành gia sư' : 'Become a Mentor', icon: Sparkles },
    { to: '/resources', label: lang === 'vi' ? 'Tài nguyên' : 'Resources', icon: BookOpen },
    { to: '/about', label: lang === 'vi' ? 'Giới thiệu' : 'About', icon: Info },
  ];

  const handleLogout = async () => {
    await logout();
    toast.success(lang === 'vi' ? 'Đã đăng xuất thành công.' : 'Signed out successfully.');
    navigate('/');
  };

  const dashLabel =
    user?.role === 'mentor' ? T.mentorPortal
    : user?.role === 'admin' ? T.adminConsole
    : T.myDashboard;

  return (
    <nav className="relative z-20 flex flex-row items-center justify-between px-4 sm:px-10 py-4 sm:py-6 max-w-7xl mx-auto w-full">
      {/* DynForge Brand Logo */}
      <Logo size="md" />

      {/* Navigation Links directly inside page flow (Desktop) */}
      <div className="hidden md:flex flex-row items-center gap-8 lg:gap-12">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'text-sm sm:text-base font-medium transition-all duration-300',
                isActive
                  ? 'text-white font-bold drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                  : 'text-white/60 hover:text-white'
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Language & CTA Action Controls directly inside page flow (Desktop) */}
      <div className="hidden md:flex flex-row items-center gap-4">
        <LanguageSwitcher />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1 pl-1 pr-3 outline-none transition-colors hover:bg-white/20 backdrop-blur-md">
              <ImageWithFallback src={user.avatar} alt={user.name} className="size-8 rounded-full object-cover border border-white/30" />
              <span className="max-w-[120px] truncate text-sm font-medium text-white">
                {user.name}
              </span>
              <ChevronDown className="size-4 text-white/70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#090f1e] border-white/10 text-slate-100 shadow-2xl">
              <div className="px-3 py-2">
                <p className="text-xs text-slate-400">{lang === 'vi' ? 'Đăng nhập với' : 'Signed in as'}</p>
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <span className="mt-1 inline-block rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300 capitalize font-medium">
                  {user.role}
                </span>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => navigate(user.dashboardPath)} className="cursor-pointer focus:bg-white/10 focus:text-white">
                <LayoutDashboard className="size-4 mr-2 text-cyan-400" /> {dashLabel}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:bg-white/10 focus:text-red-300">
                <LogOut className="size-4 mr-2" /> {T.logOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="rounded-full border border-white/30 bg-white/5 backdrop-blur-md px-6 py-2 text-sm font-medium text-white hover:bg-white/15 hover:border-white/50 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            {lang === 'vi' ? 'Đăng nhập' : 'Sign In'}
          </button>
        )}
      </div>

      {/* Mobile Menu Trigger Button */}
      <button
        className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10 transition-all md:hidden cursor-pointer"
        onClick={() => setOpen(true)}
        aria-label="Open mobile menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Premium Mobile Slide-Over Drawer Sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          />

          {/* Drawer Content Panel */}
          <aside className="relative ml-auto z-10 flex h-full w-[85vw] max-w-sm flex-col border-l border-white/10 bg-[#030914]/98 px-5 py-5 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right duration-300 overflow-hidden">
            {/* Ambient Decorative Glow Circles */}
            <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-20 -left-16 size-44 rounded-full bg-indigo-600/15 blur-3xl" />

            {/* Top Brand & Close Row */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <Logo size="sm" />
              <button
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* Nav Items List */}
            <nav className="mt-5 flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-950/40 font-semibold'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={cn('size-4.5 shrink-0 transition-colors', isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300')} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <ChevronRight className={cn('size-4 shrink-0 transition-transform group-hover:translate-x-0.5', isActive ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400')} />
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Bottom Footer Section (User or Guest) */}
            <div className="mt-auto pt-4 border-t border-white/10 shrink-0 space-y-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <ImageWithFallback src={user.avatar} alt={user.name} className="size-11 rounded-xl object-cover ring-2 ring-cyan-500/30" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <span className="inline-block rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300 capitalize font-medium mt-0.5">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => { navigate(user.dashboardPath); setOpen(false); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-semibold text-sm py-2.5 shadow-lg shadow-cyan-950/60 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <LayoutDashboard className="size-4" />
                    <span>{dashLabel}</span>
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <LanguageSwitcher />
                    <button
                      onClick={() => { handleLogout(); setOpen(false); }}
                      className="flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="size-3.5" />
                      <span>{T.logOut}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2.5">
                  <button
                    onClick={() => { navigate('/login'); setOpen(false); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-semibold text-sm py-2.5 shadow-lg shadow-cyan-950/60 cursor-pointer"
                  >
                    <span>{lang === 'vi' ? 'Đăng nhập' : 'Sign In'}</span>
                  </button>
                  <button
                    onClick={() => { navigate('/mentors'); setOpen(false); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-sm py-2.5 transition-all cursor-pointer"
                  >
                    <Search className="size-4" />
                    <span>{lang === 'vi' ? 'Tìm gia sư' : 'Find a Mentor'}</span>
                  </button>
                  <div className="flex items-center justify-center pt-2 border-t border-white/5">
                    <LanguageSwitcher />
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </nav>
  );
}
