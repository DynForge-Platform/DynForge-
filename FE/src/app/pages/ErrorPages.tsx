import { useNavigate, useRouteError } from 'react-router';
import { GraduationCap, ShieldX, LifeBuoy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';

function ErrorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pale-blue px-5">
      <div className="mb-8"><Logo /></div>
      {children}
    </div>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();
  const { T } = useLanguage();
  return (
    <ErrorShell>
      <div className="flex size-24 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <GraduationCap className="size-12" />
      </div>
      <h1 className="mt-6 text-center text-navy" style={{ fontSize: '2.25rem', fontWeight: 800 }}>
        {T.notFoundTitle}
      </h1>
      <p className="mt-3 max-w-sm text-center text-muted-foreground">{T.notFoundDesc}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={() => navigate('/dashboard')}>{T.goToDashboard}</Button>
        <Button size="lg" variant="outline" onClick={() => navigate('/')}>{T.backToHome}</Button>
        <Button size="lg" variant="ghost">
          <LifeBuoy className="size-4" /> {T.contactSupport}
        </Button>
      </div>
    </ErrorShell>
  );
}

export function PermissionDeniedPage() {
  const navigate = useNavigate();
  const { T } = useLanguage();
  return (
    <ErrorShell>
      <div className="flex size-24 items-center justify-center rounded-3xl bg-danger/10 text-danger">
        <ShieldX className="size-12" />
      </div>
      <h1 className="mt-6 text-center text-navy" style={{ fontSize: '2.25rem', fontWeight: 800 }}>
        {T.permissionTitle}
      </h1>
      <p className="mt-3 max-w-sm text-center text-muted-foreground">{T.permissionDesc}</p>
      <Button size="lg" className="mt-8" onClick={() => navigate('/dashboard')}>
        {T.goBackDashboard}
      </Button>
    </ErrorShell>
  );
}

export function GlobalErrorBoundary() {
  const error = useRouteError() as { message?: string } | null;
  const navigate = useNavigate();
  const { T } = useLanguage();
  return (
    <ErrorShell>
      <div className="flex size-24 items-center justify-center rounded-3xl bg-warning/10 text-warning">
        <GraduationCap className="size-12" />
      </div>
      <h1 className="mt-6 text-center text-navy" style={{ fontSize: '2.25rem', fontWeight: 800 }}>
        Something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-center text-muted-foreground">
        {error?.message ?? 'An unexpected error occurred. Please try refreshing the page.'}
      </p>
      <div className="mt-8 flex gap-3">
        <Button size="lg" onClick={() => navigate('/')}>{T.backToHome}</Button>
        <Button size="lg" variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    </ErrorShell>
  );
}
