import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
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
    { to: '/', label: 'Home' },
    { to: '/mentors', label: lang === 'vi' ? 'Tìm gia sư' : 'Find Mentors' },
    { to: '/become-a-mentor', label: lang === 'vi' ? 'Trở thành gia sư' : 'Become a Mentor' },
    { to: '/resources', label: lang === 'vi' ? 'Tài nguyên' : 'Resources' },
    { to: '/about', label: lang === 'vi' ? 'Giới thiệu' : 'About' },
  ];

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
    navigate('/');
  };

  const dashLabel =
    user?.role === 'mentor' ? T.mentorPortal
    : user?.role === 'admin' ? T.adminConsole
    : T.myDashboard;

  return (
    <nav className="relative z-20 flex flex-row items-center justify-between px-6 sm:px-10 py-6 max-w-7xl mx-auto w-full">
      {/* DynForge Brand Logo */}
      <Logo size="md" />

      {/* Navigation Links directly inside page flow */}
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

      {/* Language & CTA Action Controls directly inside page flow */}
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
                <p className="text-xs text-slate-400">Signed in as</p>
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
            onClick={() => navigate('/mentors')}
            className="rounded-full border border-white/30 bg-white/5 backdrop-blur-md px-6 py-2 text-sm font-medium text-white hover:bg-white/15 hover:border-white/50 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            {lang === 'vi' ? 'Tìm gia sư ngay' : 'Find a Mentor'}
          </button>
        )}
      </div>

      {/* Mobile menu button */}
      <button
        className="flex size-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white md:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 border-b border-white/10 bg-[#020B18]/95 backdrop-blur-xl px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                    isActive ? 'bg-white/10 text-white font-bold border border-white/20' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <ImageWithFallback src={user.avatar} alt={user.name} className="size-9 rounded-full object-cover border border-white/30" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <span className="inline-block rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[11px] text-cyan-300 capitalize font-medium">
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { navigate(user.dashboardPath); setOpen(false); }}
                    className="flex w-full items-center gap-2.5 rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-all text-left cursor-pointer"
                  >
                    <LayoutDashboard className="size-4 text-cyan-400" />
                    <span>{dashLabel}</span>
                  </button>
                  <div className="flex items-center justify-between pt-1">
                    <LanguageSwitcher />
                    <button
                      onClick={() => { handleLogout(); setOpen(false); }}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <LogOut className="size-4" />
                      <span>{T.logOut}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <LanguageSwitcher />
                <button
                  onClick={() => { navigate('/mentors'); setOpen(false); }}
                  className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm text-white font-medium hover:bg-white/20 transition-all cursor-pointer"
                >
                  {lang === 'vi' ? 'Tìm gia sư ngay' : 'Find a Mentor'}
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </nav>
  );
}
