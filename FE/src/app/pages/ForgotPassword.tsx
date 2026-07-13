import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, KeyRound, Lock, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { forgotPassword, verifyOtp, resetPassword } from '../services/authService';

type Step = 'email' | 'otp' | 'reset' | 'done';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email.'); return; }
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('If the email is registered, an OTP has been sent.');
      setStep('otp');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) { toast.error('Please enter the code from your email.'); return; }
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      toast.success('Code verified.');
      setStep('reset');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirm) { toast.error('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      setStep('done');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await forgotPassword(email);
      toast.success('A new code has been sent.');
    } catch { toast.error('Could not resend code.'); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-pale-blue/40 px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>

        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          {/* Step indicator */}
          {step !== 'done' && (
            <div className="mb-6 flex items-center justify-center gap-2">
              {(['email', 'otp', 'reset'] as const).map((s, i) => (
                <span
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    step === s ? 'w-8 bg-primary' : i < ['email', 'otp', 'reset'].indexOf(step) ? 'w-8 bg-primary/40' : 'w-4 bg-border'
                  }`}
                />
              ))}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={submitEmail} className="space-y-4">
              <div className="text-center">
                <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Mail className="size-6" />
                </span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Forgot password?</h1>
                <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send a reset code.</p>
              </div>
              <div>
                <Label htmlFor="fp-email" className="mb-1.5 block">Email</Label>
                <Input id="fp-email" type="email" placeholder="you@fpt.edu.vn" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-input-background" autoFocus />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Send reset code'}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={submitOtp} className="space-y-4">
              <div className="text-center">
                <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <KeyRound className="size-6" />
                </span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Enter the code</h1>
                <p className="mt-1 text-sm text-muted-foreground">We sent a 6-digit code to <strong>{email}</strong>.</p>
              </div>
              <div>
                <Label htmlFor="fp-otp" className="mb-1.5 block">Verification code</Label>
                <Input
                  id="fp-otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="bg-input-background text-center text-lg tracking-[0.5em]"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Verify code'}
              </Button>
              <button type="button" onClick={resend} className="w-full text-center text-sm text-primary" style={{ fontWeight: 500 }}>
                Didn't get it? Resend code
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={submitReset} className="space-y-4">
              <div className="text-center">
                <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Lock className="size-6" />
                </span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Set a new password</h1>
                <p className="mt-1 text-sm text-muted-foreground">Choose a strong password you haven't used before.</p>
              </div>
              <div>
                <Label htmlFor="fp-new" className="mb-1.5 block">New password</Label>
                <Input id="fp-new" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-input-background" autoFocus />
              </div>
              <div>
                <Label htmlFor="fp-confirm" className="mb-1.5 block">Confirm password</Label>
                <Input id="fp-confirm" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="bg-input-background" />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Reset password'}
              </Button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center">
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-9" />
              </span>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Password reset!</h1>
                <p className="mt-1 text-sm text-muted-foreground">You can now sign in with your new password.</p>
              </div>
              <Button className="w-full" size="lg" onClick={() => navigate('/login')}>Back to sign in</Button>
            </div>
          )}
        </div>

        {step !== 'done' && (
          <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
