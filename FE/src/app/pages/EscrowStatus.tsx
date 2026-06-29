import { useLocation, useNavigate } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import {
  CheckCircle2,
  ShieldCheck,
  CalendarCheck,
  CircleCheck,
  Wallet,
  Scale,
  LifeBuoy,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { StepProgress } from '../components/common';
import { formatCurrency } from '../data/mockData';

export function EscrowStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const { T } = useLanguage();
  const state = (location.state as { mentor: string; amount: number; day: number; slot: string }) ?? {
    mentor: 'Linh Nguyen',
    amount: 375000,
    day: 22,
    slot: '09:00',
  };
  const escrowId = 'ESC-2026-' + Math.floor(100000 + Math.random() * 900000);

  const next = [
    { icon: CalendarCheck, title: T.attendSession, desc: T.attendSessionDesc },
    { icon: CircleCheck,   title: T.markCompleted, desc: T.markCompletedDesc },
    { icon: Wallet,        title: T.paymentReleased, desc: T.paymentReleasedDesc },
  ];

  const protections = [
    'Funds are held until the session is completed.',
    'You can open a dispute if there is a problem.',
    'GRADORA reviews all disputes fairly.',
    'The mentor gets paid only after your confirmation.',
  ];

  return (
    <div className="mx-auto max-w-[760px] px-5 py-12">
      <div className="mb-10">
        <StepProgress
          steps={[T.paymentCompleted, T.heldInEscrow, T.releasedAfter]}
          current={1}
        />
      </div>

      {/* Success card */}
      <Card className="border-success/20 p-8 text-center">
        <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{T.escrowSuccessTitle}</h1>
        <p className="mt-2 text-muted-foreground">{T.escrowSuccessDesc}</p>

        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border text-left sm:grid-cols-2">
          <Info label="Amount" value={formatCurrency(state.amount)} />
          <Info label="Escrow ID" value={escrowId} />
          <Info label="Mentor" value={state.mentor} />
          <Info label="Session date" value={`${state.day} June 2026 · ${state.slot}`} />
        </div>
      </Card>

      {/* What happens next */}
      <Card className="mt-6 border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{T.whatHappensNext}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {next.map((n, i) => {
            const Icon = n.icon;
            return (
              <div key={n.title} className="rounded-xl border border-border p-4">
                <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4.5" />
                </span>
                <p style={{ fontWeight: 600 }}>{i + 1}. {n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Protection */}
      <Card className="mt-6 border-border p-6">
        <h2 className="mb-4 flex items-center gap-2" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          <ShieldCheck className="size-5 text-success" /> {T.yourProtection}
        </h2>
        <ul className="space-y-3">
          {protections.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Scale className="mt-0.5 size-4 shrink-0 text-primary" /> {p}
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1" onClick={() => navigate('/dashboard')}>
          {T.viewMySessions}
        </Button>
        <Button size="lg" variant="outline" className="flex-1">
          <LifeBuoy className="size-4" /> {T.contactSupport}
        </Button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
