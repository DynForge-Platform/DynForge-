import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { Logo } from '../Logo';
import { buttonVariants } from '../ui/button';
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
  const { T } = useLanguage();
  const navigate = useNavigate();

  const navItems = [
    { to: '/mentors', label: T.findMentors },
    { to: '/how-it-works', label: T.howItWorksTitle },
    { to: '/become-a-mentor', label: T.becomeMentor },
    { to: '/resources', label: T.resources },
    { to: '/about', label: T.about },
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
    <header className="sticky top-0 z-50 border-b border-border bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )
                }
                style={{ fontWeight: 500 }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-border py-1 pl-1 pr-3 outline-none transition-colors hover:bg-accent">
                <ImageWithFallback src={user.avatar} alt={user.name} className="size-8 rounded-full object-cover" />
                <span className="max-w-[120px] truncate text-sm" style={{ fontWeight: 500 }}>
                  {user.name}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm" style={{ fontWeight: 600 }}>{user.name}</p>
                  <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary capitalize" style={{ fontWeight: 500 }}>
                    {user.role}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(user.dashboardPath)} className="cursor-pointer">
                  <LayoutDashboard className="size-4" /> {dashLabel}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-danger focus:text-danger">
                  <LogOut className="size-4" /> {T.logOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className={buttonVariants({ variant: 'ghost' })}>
                {T.logIn}
              </Link>
              <Link to="/register" className={buttonVariants({ variant: 'default' })}>
                {T.joinNow}
              </Link>
            </>
          )}
        </div>

        <button
          className="flex size-10 items-center justify-center rounded-lg border border-border lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-white px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn('rounded-lg px-3 py-2.5 text-sm', isActive ? 'bg-accent text-primary' : 'text-muted-foreground')
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-3">
              <LanguageSwitcher />
            </div>
            {user ? (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => { navigate(user.dashboardPath); setOpen(false); }}
                  className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-start')}
                >
                  <LayoutDashboard className="size-4" /> {dashLabel}
                </button>
                <button
                  onClick={() => { handleLogout(); setOpen(false); }}
                  className={cn(buttonVariants({ variant: 'ghost' }), 'w-full justify-start text-danger')}
                >
                  <LogOut className="size-4" /> {T.logOut}
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-3">
                <Link to="/login" className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 justify-center')} onClick={() => setOpen(false)}>
                  {T.logIn}
                </Link>
                <Link to="/register" className={cn(buttonVariants({ variant: 'default' }), 'flex-1 justify-center')} onClick={() => setOpen(false)}>
                  {T.joinNow}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
