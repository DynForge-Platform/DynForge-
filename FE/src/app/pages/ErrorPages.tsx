import { Link } from 'react-router';
import { GraduationCap, ShieldX, LifeBuoy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';

function ErrorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020B18] text-slate-100 px-5 selection:bg-cyan-500 selection:text-white">
      <div className="mb-8"><Logo light /></div>
      {children}
    </div>
  );
}

export function NotFoundPage() {
  const { T } = useLanguage();
  return (
    <ErrorShell>
      <div className="flex size-24 items-center justify-center rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
        <GraduationCap className="size-12" />
      </div>
      <h1 className="mt-6 text-center text-white font-normal text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
        {T.notFoundTitle}
      </h1>
      <p className="mt-3 max-w-sm text-center text-slate-400 text-sm leading-relaxed">{T.notFoundDesc}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/dashboard" className="inline-flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl px-6 py-3 text-sm">{T.goToDashboard}</Link>
        <Link to="/" className="inline-flex items-center justify-center border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 rounded-xl px-6 py-3 text-sm">{T.backToHome}</Link>
        <Link to="/support/contact" className="inline-flex items-center justify-center text-slate-300 hover:bg-white/5 hover:text-white rounded-xl px-6 py-3 text-sm">
          <LifeBuoy className="size-4 mr-2" /> {T.contactSupport}
        </Link>
      </div>
    </ErrorShell>
  );
}

export function PermissionDeniedPage() {
  const { T } = useLanguage();
  return (
    <ErrorShell>
      <div className="flex size-24 items-center justify-center rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
        <ShieldX className="size-12" />
      </div>
      <h1 className="mt-6 text-center text-white font-normal text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
        {T.permissionTitle}
      </h1>
      <p className="mt-3 max-w-sm text-center text-slate-400 text-sm leading-relaxed">{T.permissionDesc}</p>
      <Link to="/dashboard" className="mt-8 inline-flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl px-8 py-3 text-sm">
        {T.goBackDashboard}
      </Link>
    </ErrorShell>
  );
}

export function GlobalErrorBoundary() {
  return (
    <ErrorShell>
      <h1 className="text-center text-white font-normal text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>Application Error</h1>
      <p className="mt-3 max-w-md text-center text-slate-400 text-sm">An unexpected error occurred. Please try returning to home.</p>
      <a href="/" className="mt-8 inline-block bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-8 py-3 rounded-xl text-sm">
        Reload Home
      </a>
    </ErrorShell>
  );
}
