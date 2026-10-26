import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { getGoogleClientId } from '../services/authService';
import { ShieldCheck, BadgeCheck, Star, Mail, Loader2, ArrowLeft, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useAuth, AuthRole } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useUniversity } from '../context/UniversityContext';
import { toast } from 'sonner';

import Lottie from 'lottie-react';
import onlineLearningAnimation from '../../assets/animations/Online Learning.json';

const DASHBOARD_PATHS: Record<AuthRole, string> = {
  mentee: '/dashboard',
  mentor: '/mentor/dashboard',
  admin: '/admin/dashboard',
};

function BrandPanel({ title, subtitle }: { title: string; subtitle: string }) {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  return (
    <div className="relative flex h-full min-h-screen flex-col justify-between overflow-hidden bg-[#020B18] p-10 lg:p-14 border-r border-white/10 text-slate-100">
      {/* Background ambient glowing lights */}
      <div className="absolute -top-32 -left-32 size-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <Logo light />

      {/* Lottie Animation: Online Learning */}
      <div className="my-auto flex flex-col items-center justify-center text-center py-6">
        <div className="w-full max-w-md drop-shadow-2xl my-2">
          <Lottie animationData={onlineLearningAnimation} loop={true} autoplay={true} />
        </div>
        <h2
          className="text-white text-center mt-6 text-3xl lg:text-4xl font-normal leading-tight max-w-md"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h2>
        <p className="mt-3 text-center text-white/70 text-sm lg:text-base max-w-md leading-relaxed font-normal">{subtitle}</p>
      </div>

      <div className="flex items-center justify-between text-xs lg:text-sm text-slate-400 border-t border-white/10 pt-5">
        <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-cyan-400" /> {vi ? 'Bảo mật ký quỹ 🛡️' : 'Escrow Security 🛡️'}</span>
        <span className="flex items-center gap-2"><Star className="size-4 text-amber-400" /> {vi ? 'Mentor đã xác minh ✨' : 'Verified Mentors ✨'}</span>
      </div>
    </div>
  );
}

function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-12 bg-[#020B18] text-slate-100 overflow-x-hidden">
      <div className="hidden lg:block lg:col-span-6 xl:col-span-7 h-full">
        <BrandPanel title={title} subtitle={subtitle} />
      </div>

      <div className="lg:col-span-6 xl:col-span-5 flex min-h-screen flex-col justify-center p-4 sm:p-8 lg:p-12 bg-[#020B18] relative">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Floating Dark Glassmorphic Form Card */}
        <div className="relative z-10 w-full max-w-md mx-auto rounded-3xl border border-white/10 bg-[#090f1e]/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
          <div className="mb-6 lg:hidden flex justify-center"><Logo light /></div>
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

function GoogleButton() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { loginWithGoogle } = useAuth();
  const { lang } = useLanguage();
  const vi = lang === 'vi';
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
            toast.success(vi ? 'Đã đăng nhập bằng Google. Chào mừng bạn!' : 'Signed in with Google. Welcome!');
            navigate(redirectTo ?? u.dashboardPath ?? DASHBOARD_PATHS[u.role]);
          } catch (err: any) {
            toast.error(err?.response?.data?.message ?? (vi ? 'Đăng nhập Google thất bại. Vui lòng thử lại.' : 'Google sign-in failed. Please try again.'));
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 340,
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

  if (clientId === '') {
    return (
      <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-full h-11"
        onClick={() => toast.info(vi ? 'Google Sign-In chưa được cấu hình (google.client-id trong application.properties).' : 'Google Sign-In is not configured (google.client-id in application.properties).')}>
        <svg className="size-4 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
          <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/>
        </svg>
        {vi ? 'Tiếp tục với Google' : 'Continue with Google'}
      </Button>
    );
  }

  return <div ref={buttonRef} className="flex min-h-10 justify-center" />;
}

// ── Login ──────────────────────────────────────────────────────
export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { user, logout, loginWithCredentials } = useAuth();
  const { T, lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear stale session if visitor opens login directly
  useEffect(() => {
    if (user) {
      logout();
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(lang === 'vi' ? 'Vui lòng nhập Email và Mật khẩu.' : 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const u = await loginWithCredentials(email, password);
      toast.success(lang === 'vi' ? 'Chào mừng bạn trở lại!' : 'Welcome back!');
      navigate(redirectTo ?? u.dashboardPath ?? DASHBOARD_PATHS[u.role]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (lang === 'vi' ? 'Email hoặc mật khẩu không đúng.' : 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={lang === 'vi' ? 'Học từ những người đi trước.' : 'Learn from mentors who have been there.'}
      subtitle={lang === 'vi' ? 'Đặt lịch với các anh chị khóa trên, cựu sinh viên và giảng viên đã xác minh để được kèm môn, hỗ trợ đồ án và tư vấn nghề nghiệp.' : 'Book verified seniors, alumni, and lecturers for course tutoring, thesis support, and career advice.'}
    >
      <h1 className="text-3xl text-white font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
        {T.welcomeBack}
      </h1>
      <p className="text-xs text-slate-400 mb-6">{T.loginSubtitle}</p>

      <div className="mb-5"><GoogleButton /></div>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-white/10" /> {T.orSignIn} <span className="h-px flex-1 bg-white/10" />
      </div>

      <form className="space-y-4" onSubmit={submit}>
        <div>
          <Label htmlFor="email" className="mb-1.5 block text-xs text-slate-300">{T.email}</Label>
          <Input
            id="email" type="email" placeholder="you@fpt.edu.vn"
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl h-11 text-sm"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="text-xs text-slate-300">{T.password}</Label>
            <Link to="/forgot-password" className="text-xs text-cyan-400 hover:underline">
              {lang === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
            </Link>
          </div>
          <Input
            id="password" type="password" placeholder="••••••••"
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl h-11 text-sm"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl h-11" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : T.logIn}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        {T.dontHaveAccount}{' '}
        <Link to="/register" className="text-cyan-400 font-medium hover:underline">{T.createOne}</Link>
      </p>
    </AuthShell>
  );
}

// ── Register (Join Now) ────────────────────────────────────────
export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultApplyRole = searchParams.get('apply') === 'mentor' ? 'mentor' : 'mentee';

  const { initiateRegister, verifyRegisterOtp, resendRegisterOtp } = useAuth();
  const { T, lang } = useLanguage();
  const { universities, setSelectedCode } = useUniversity();
  const [role, setRole] = useState<AuthRole>(defaultApplyRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [universityCode, setUniversityCode] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification state
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error(lang === 'vi' ? 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu.' : 'Please fill in your full name, email, and password.');
      return;
    }
    if (password.length < 8) {
      toast.error(lang === 'vi' ? 'Mật khẩu phải có ít nhất 8 ký tự.' : 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const msg = await initiateRegister(
        name.trim(),
        email.trim(),
        password,
        role === 'mentor' ? 'MENTOR' : 'MENTEE'
      );
      toast.success(msg || (lang === 'vi' ? `Mã xác thực đã được gửi đến email ${email.trim()}` : `Verification code sent to ${email.trim()}`));
      setStep('otp');
      setCountdown(60);
      setOtp('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (lang === 'vi' ? 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.' : 'Registration failed. Please check your inputs.'));
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error(lang === 'vi' ? 'Vui lòng nhập đủ 6 chữ số mã OTP.' : 'Please enter the full 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      const u = await verifyRegisterOtp(email.trim(), otp.trim());
      if (universityCode) setSelectedCode(universityCode);
      toast.success(lang === 'vi' ? 'Xác thực tài khoản thành công! Chào mừng bạn gia nhập DynForge.' : 'Account verified successfully! Welcome to DynForge.');
      navigate(u.dashboardPath ?? DASHBOARD_PATHS[u.role]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (lang === 'vi' ? 'Mã xác thực không hợp lệ hoặc đã hết hạn.' : 'Invalid or expired verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      const msg = await resendRegisterOtp(email.trim());
      toast.success(msg || (lang === 'vi' ? 'Đã gửi lại mã xác thực mới vào email.' : 'New OTP has been sent to your email.'));
      setCountdown(60);
      setOtp('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (lang === 'vi' ? 'Gửi lại mã thất bại.' : 'Failed to resend OTP.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title={lang === 'vi' ? 'Gia nhập DynForge hôm nay.' : 'Join DynForge today.'}
      subtitle={lang === 'vi' ? 'Kết nối với các mentor học thuật đã xác minh và tăng tốc hành trình đại học của bạn.' : 'Connect with verified academic mentors and accelerate your university journey.'}
    >
      {step === 'otp' ? (
        <div>
          <button
            type="button"
            onClick={() => { setStep('form'); setOtp(''); }}
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            {lang === 'vi' ? 'Quay lại thay đổi thông tin' : 'Back to details'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="size-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Mail className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl text-white font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                {lang === 'vi' ? 'Xác thực Email' : 'Verify Email'}
              </h1>
              <p className="text-xs text-slate-400">
                {lang === 'vi' ? 'Mã xác thực gồm 6 chữ số' : '6-digit verification code'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-5 text-xs text-slate-300 leading-relaxed">
            {lang === 'vi' ? (
              <>
                Chúng tôi đã gửi mã xác thực (OTP) tới email: <br />
                <strong className="text-cyan-400 font-semibold">{email}</strong>.
                <br />
                Vui lòng kiểm tra hộp thư (kể cả mục Thư rác/Spam) và nhập mã để kích hoạt tài khoản.
              </>
            ) : (
              <>
                We have sent an OTP code to: <br />
                <strong className="text-cyan-400 font-semibold">{email}</strong>.
                <br />
                Please check your inbox (including Spam) to activate your account.
              </>
            )}
          </div>

          <form className="space-y-4" onSubmit={submitOtp}>
            <div>
              <Label htmlFor="otp" className="mb-1.5 block text-xs text-slate-300">
                {lang === 'vi' ? 'Mã xác thực OTP (6 chữ số)' : 'OTP Code (6 digits)'}
              </Label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                autoFocus
                placeholder="000000"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl h-12 text-center text-2xl font-mono tracking-[0.4em] font-bold"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl h-11"
              disabled={loading || otp.length < 6}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                lang === 'vi' ? 'Xác thực & Tạo tài khoản' : 'Verify & Complete'
              )}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {lang === 'vi' ? 'Chưa nhận được mã?' : "Didn't receive code?"}
            </span>
            {countdown > 0 ? (
              <span className="text-slate-500 font-medium">
                {lang === 'vi' ? `Gửi lại sau ${countdown}s` : `Resend in ${countdown}s`}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-cyan-400 hover:underline font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {resending ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                {lang === 'vi' ? 'Gửi lại mã OTP' : 'Resend OTP'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-3xl text-white font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            {T.createAccount}
          </h1>
          <p className="text-xs text-slate-400 mb-6">{T.registerSubtitle}</p>

          {/* Role Selection Switcher */}
          <div className="mb-5 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setRole('mentee')}
              className={`py-2 text-xs font-medium rounded-xl transition-all ${
                role === 'mentee' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              🎓 {T.roleMentee}
            </button>
            <button
              type="button"
              onClick={() => setRole('mentor')}
              className={`py-2 text-xs font-medium rounded-xl transition-all ${
                role === 'mentor' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌟 {T.roleMentor}
            </button>
          </div>

          <div className="mb-5"><GoogleButton /></div>

          <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-white/10" /> {T.orRegisterWithEmail} <span className="h-px flex-1 bg-white/10" />
          </div>

          <form className="space-y-3.5" onSubmit={submitForm}>
            <div>
              <Label htmlFor="name" className="mb-1 block text-xs text-slate-300">{T.fullName}</Label>
              <Input
                id="name" type="text" placeholder="Nguyễn Văn A"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl h-10 text-sm"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reg-email" className="mb-1 block text-xs text-slate-300">{T.email}</Label>
              <Input
                id="reg-email" type="email" placeholder="you@fpt.edu.vn"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl h-10 text-sm"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reg-password" className="mb-1 block text-xs text-slate-300">{T.password}</Label>
              <Input
                id="reg-password" type="password" placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl h-10 text-sm"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs text-slate-300">{T.university}</Label>
              <Select value={universityCode || undefined} onValueChange={setUniversityCode}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-10 text-sm">
                  <SelectValue placeholder={T.selectUniversity} />
                </SelectTrigger>
                <SelectContent className="bg-[#090f1e] text-white border-white/10">
                  {universities.map((u) => (
                    <SelectItem key={u.code} value={u.code}>{u.shortName || u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {role === 'mentor' && (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {lang === 'vi'
                    ? 'Bạn sẽ xác minh trường bằng email trường sau khi đăng ký.'
                    : 'You will verify your university with a school email after signing up.'}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl h-11 mt-2" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : (lang === 'vi' ? 'Tiếp tục nhận mã OTP' : 'Continue to verify OTP')}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            {T.alreadyHaveAccount}{' '}
            <Link to="/login" className="text-cyan-400 font-medium hover:underline">{T.logIn}</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
