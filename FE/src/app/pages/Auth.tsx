import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { getGoogleClientId } from '../services/authService';
import { ShieldCheck, BadgeCheck, Star, Mail, GraduationCap, Users, LayoutDashboard, Loader2 } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { cn } from '../components/ui/utils';
import { useAuth, AuthRole } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';

const trustMessages = [
  { icon: ShieldCheck, label: 'Escrow anti-fraud protection' },
  { icon: BadgeCheck, label: 'Verified mentors only' },
  { icon: Star, label: 'Real student reviews' },
  { icon: Mail, label: 'University email recommended' },
];

const quickRoles: { label: string; role: AuthRole; color: string; icon: React.ElementType }[] = [
  { label: 'Mentee', role: 'mentee', color: 'bg-sky-500', icon: Users },
  { label: 'Mentor', role: 'mentor', color: 'bg-emerald-500', icon: GraduationCap },
  { label: 'Admin', role: 'admin', color: 'bg-amber-500', icon: LayoutDashboard },
];

// Seeded demo accounts (see DataSeeder). Quick-login uses these so it obtains a real JWT.
const DEMO_CREDENTIALS: Record<AuthRole, { email: string; password: string }> = {
  mentee: { email: 'student@gradora.vn', password: 'Gradora@123' },
  mentor: { email: 'khoa.tran@gradora.vn', password: 'Gradora@123' },
  admin: { email: 'admin@gradora.vn', password: 'Gradora@123' },
};

const DASHBOARD_PATHS: Record<AuthRole, string> = {
  mentee: '/dashboard',
  mentor: '/mentor/dashboard',
  admin: '/admin/dashboard',
};

function BrandPanel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-[#1e3acc] to-navy p-12 text-white lg:flex">
      <Logo light />
      <div>
        <h2 className="text-white" style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>
          {title}
        </h2>
        <p className="mt-4 max-w-sm text-white/70">{subtitle}</p>
        <ul className="mt-8 space-y-4">
          {trustMessages.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                <Icon className="size-4.5" />
              </span>
              <span style={{ fontWeight: 500 }}>{label}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm text-white/50">
        Your payment is held securely and released only after the session is completed.
      </p>
    </div>
  );
}

function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel title={title} subtitle={subtitle} />
      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          {children}
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window { google?: any }
}

const GSI_SCRIPT_ID = 'google-gsi-client';

/**
 * Real Google Sign-In via Google Identity Services. Fetches the OAuth client id from the
 * backend, loads the GIS script and renders Google's own button; the returned ID token is
 * exchanged at POST /api/auth/google for our JWT session (auto-registers first-time users).
 */
function GoogleButton() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { loginWithGoogle } = useAuth();
  // null = still loading config, '' = not configured on the backend
  const [clientId, setClientId] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getGoogleClientId().then(setClientId).catch(() => setClientId(''));
  }, []);

  useEffect(() => {
    if (!clientId) return;

    const init = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            const u = await loginWithGoogle(response.credential);
            toast.success('Signed in with Google. Welcome!');
            navigate(redirectTo ?? u.dashboardPath ?? DASHBOARD_PATHS[u.role]);
          } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Google sign-in failed. Please try again.');
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 380,
      });
    };

    if (window.google?.accounts?.id) { init(); return; }
    let script = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = GSI_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', init);
    return () => script?.removeEventListener('load', init);
  }, [clientId, loginWithGoogle, navigate, redirectTo]);

  // Backend has no google.client-id configured — show an inert button that explains why.
  if (clientId === '') {
    return (
      <Button variant="outline" className="w-full"
        onClick={() => toast.info('Google Sign-In chưa được cấu hình (google.client-id trong application.properties).')}>
        <svg className="size-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
          <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/>
        </svg>
        Continue with Google
      </Button>
    );
  }

  return <div ref={buttonRef} className="flex min-h-10 justify-center" />;
}

function QuickLogin({ onLogin }: { onLogin: (role: AuthRole) => void }) {
  const { T } = useLanguage();
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-primary/30 bg-accent/60 p-4">
      <p className="mb-3 text-center text-xs text-muted-foreground" style={{ fontWeight: 600 }}>
        {T.quickAccess}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {quickRoles.map(({ label, role, color, icon: Icon }) => (
          <button
            key={role}
            onClick={() => onLogin(role)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-white py-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            style={{ fontWeight: 600 }}
          >
            <span className={cn('size-3 rounded-full', color)} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Login ──────────────────────────────────────────────────────
export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { login, loginWithCredentials } = useAuth();
  const { T, lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async (role: AuthRole) => {
    const dest = redirectTo && role === 'mentee' ? redirectTo : DASHBOARD_PATHS[role];
    try {
      // Real login with the seeded demo account → obtains a JWT so API calls work.
      const { email: demoEmail, password: demoPassword } = DEMO_CREDENTIALS[role];
      await loginWithCredentials(demoEmail, demoPassword);
      toast.success(`Signed in as ${role.charAt(0).toUpperCase() + role.slice(1)}. Welcome back!`);
      navigate(dest);
    } catch {
      // Fallback: seeded accounts not present — use offline demo profile (no JWT).
      login(role);
      toast.warning('Demo mode (no backend session). Seed the database to enable live data.');
      navigate(dest);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { handleQuickLogin('mentee'); return; }
    setLoading(true);
    try {
      const u = await loginWithCredentials(email, password);
      toast.success('Welcome back!');
      // Route to the user's own workspace based on role (avoids 403 on /dashboard for admin/mentor).
      navigate(redirectTo ?? u.dashboardPath ?? DASHBOARD_PATHS[u.role]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Find trusted academic mentors from your university."
      subtitle="Book verified seniors, alumni, and lecturers for course tutoring, thesis support, and career advice."
    >
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{T.welcomeBack}</h1>
      <p className="mt-1 text-muted-foreground">{T.loginSubtitle}</p>

      <QuickLogin onLogin={handleQuickLogin} />

      <div className="my-5 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> {T.orSignIn} <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mb-5"><GoogleButton /></div>

      <form className="space-y-4" onSubmit={submit}>
        <div>
          <Label htmlFor="email" className="mb-1.5 block">{T.email}</Label>
          <Input
            id="email" type="email" placeholder="you@fpt.edu.vn"
            className="bg-input-background"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password">{T.password}</Label>
            <Link to="/forgot-password" className="text-sm text-primary" style={{ fontWeight: 500 }}>
              {lang === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
            </Link>
          </div>
          <Input
            id="password" type="password" placeholder="••••••••"
            className="bg-input-background"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : T.logIn}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {T.dontHaveAccount}{' '}
        <Link to="/register" className="text-primary" style={{ fontWeight: 500 }}>{T.createOne}</Link>
      </p>
    </AuthShell>
  );
}

// ── Register (Join Now) ────────────────────────────────────────
export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applyingAsMentor = searchParams.get('apply') === 'mentor';
  const { login, loginWithCredentials, registerWithCredentials } = useAuth();
  const { T } = useLanguage();
  const [role, setRole] = useState<'mentee' | 'mentor'>(applyingAsMentor ? 'mentor' : 'mentee');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async (r: AuthRole) => {
    try {
      const { email: demoEmail, password: demoPassword } = DEMO_CREDENTIALS[r];
      await loginWithCredentials(demoEmail, demoPassword);
      toast.success(`Signed in as ${r.charAt(0).toUpperCase() + r.slice(1)}. Welcome to GRADORA!`);
      navigate(DASHBOARD_PATHS[r]);
    } catch {
      login(r);
      toast.warning('Demo mode (no backend session). Seed the database to enable live data.');
      navigate(DASHBOARD_PATHS[r]);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      login(role);
      toast.success('Account created! Welcome to GRADORA.');
      navigate(role === 'mentor' ? '/mentor/dashboard' : '/dashboard');
      return;
    }
    setLoading(true);
    try {
      await registerWithCredentials(fullName, email, password, role === 'mentor' ? 'MENTOR' : 'MENTEE');
      toast.success('Account created! Welcome to GRADORA.');
      // Mentors go straight to the application/verification form to submit documents.
      navigate(role === 'mentor' ? '/mentor/verification' : '/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Teach what you've mastered — or find the mentor you need."
      subtitle="Join thousands of FPTU students learning safely through verified mentors and escrow-protected sessions."
    >
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{T.createYourAccount}</h1>
      <p className="mt-1 text-muted-foreground">{T.joinSubtitle}</p>

      <QuickLogin onLogin={handleQuickLogin} />

      <div className="my-5 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> {T.orCreate} <span className="h-px flex-1 bg-border" />
      </div>

      {/* Role selector */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {([
          { key: 'mentee', label: T.iAmMentee, icon: Users },
          { key: 'mentor', label: T.iAmMentor, icon: GraduationCap },
        ] as const).map(({ key, label, icon: Icon }) => {
          const active = role === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setRole(key)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors',
                active ? 'border-primary bg-accent text-primary' : 'border-border hover:bg-accent'
              )}
              style={{ fontWeight: 500 }}
            >
              <Icon className="size-5" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="mb-5"><GoogleButton /></div>

      <form className="space-y-4" onSubmit={submit}>
        <div>
          <Label htmlFor="name" className="mb-1.5 block">{T.fullName}</Label>
          <Input id="name" placeholder="Your full name" className="bg-input-background"
            value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="remail" className="mb-1.5 block">{T.email}</Label>
          <Input id="remail" type="email" placeholder="you@fpt.edu.vn" className="bg-input-background"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="rpassword" className="mb-1.5 block">{T.password}</Label>
          <Input id="rpassword" type="password" placeholder="Create a strong password" className="bg-input-background"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : T.createAccount}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {T.alreadyHaveAccount}{' '}
        <Link to="/login" className="text-primary" style={{ fontWeight: 500 }}>{T.logIn}</Link>
      </p>
    </AuthShell>
  );
}
