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
      toast.error(err?.response?.data?.message ?? 'Reset failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020B18] text-slate-100 p-6 selection:bg-cyan-500 selection:text-white">
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#090f1e]/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl text-slate-100">
        <div className="mb-6 flex justify-center">
          <Logo light />
        </div>

        {step === 'email' && (
          <form onSubmit={submitEmail} className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>Forgot Password</h2>
              <p className="mt-1 text-xs text-slate-400">Enter your email address to receive a verification code.</p>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu.vn"
                  className="bg-[#020b18] border-white/10 text-white pl-9 rounded-xl"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl shadow-lg">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null} Send Code
            </Button>
            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center text-xs text-cyan-400 hover:text-cyan-300">
                <ArrowLeft className="size-3.5 mr-1" /> Back to Log In
              </Link>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={submitOtp} className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>Enter Verification Code</h2>
              <p className="mt-1 text-xs text-slate-400">We sent a code to <strong className="text-white">{email}</strong>.</p>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">OTP Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="bg-[#020b18] border-white/10 text-white pl-9 rounded-xl text-center tracking-widest font-mono text-lg"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl shadow-lg">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null} Verify Code
            </Button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={submitReset} className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>Set New Password</h2>
              <p className="mt-1 text-xs text-slate-400">Create a new secure password for your DynForge account.</p>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="bg-[#020b18] border-white/10 text-white pl-9 rounded-xl"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  className="bg-[#020b18] border-white/10 text-white pl-9 rounded-xl"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl shadow-lg">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null} Reset Password
            </Button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>Password Reset Complete</h2>
            <p className="text-xs text-slate-400">Your password has been updated. You can now log in with your new credentials.</p>
            <Button onClick={() => navigate('/login')} className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl shadow-lg">
              Log In Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
