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
import { GsapCounter } from '../components/GsapCounter';

export function EscrowStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const { T, lang } = useLanguage();
  const state = (location.state as { mentor: string; amount: number; day: number; month?: number; year?: number; slot: string }) ?? {
    mentor: 'Linh Nguyen',
    amount: 375000,
    day: 22,
    slot: '09:00',
  };
  const escrowId = 'ESC-2026-' + Math.floor(100000 + Math.random() * 900000);

  const formattedDate =
    state.day && state.month !== undefined && state.year
      ? `${new Date(state.year, state.month, state.day).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })} · ${state.slot}`
      : `Day ${state.day} · ${state.slot}`;

  const next = [
    { icon: CalendarCheck, title: T.attendSession, desc: T.attendSessionDesc },
    { icon: CircleCheck,   title: T.markCompleted, desc: T.markCompletedDesc },
    { icon: Wallet,        title: T.paymentReleased, desc: T.paymentReleasedDesc },
  ];

  const protections = [
    'Funds are held until the session is completed.',
    'You can open a dispute if there is a problem.',
    'DynForge reviews all disputes fairly.',
    'The mentor gets paid only after your confirmation.',
  ];

  return (
    <div className="bg-[#020B18] min-h-screen text-slate-100">
      <div className="mx-auto max-w-[760px] px-5 py-12">
        <div className="mb-10">
          <StepProgress
            steps={[T.paymentCompleted, T.heldInEscrow, T.releasedAfter]}
            current={1}
          />
        </div>

        {/* Success card (Dark Glass) */}
        <Card className="border border-emerald-500/30 bg-[#090f1e]/90 backdrop-blur-xl p-8 text-center shadow-2xl rounded-2xl">
          <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="size-9" />
          </span>
          <h1 className="text-3xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>{T.escrowSuccessTitle}</h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">{T.escrowSuccessDesc}</p>

          <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-left sm:grid-cols-2">
            <Info label="Amount" value={<GsapCounter targetValue={state.amount} suffix="₫" />} />
            <Info label="Escrow ID" value={escrowId} />
            <Info label="Mentor" value={state.mentor} />
            <Info label="Session date" value={formattedDate} />
          </div>
        </Card>

        {/* What happens next */}
        <Card className="mt-6 border border-white/10 bg-[#090f1e]/90 backdrop-blur-xl p-6 text-slate-100 shadow-2xl rounded-2xl">
          <h2 className="mb-4 text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>{T.whatHappensNext}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {next.map((n, i) => {
              const Icon = n.icon;
              return (
                <div key={n.title} className="rounded-xl border border-white/10 bg-[#020b18] p-4">
                  <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Icon className="size-4.5" />
                  </span>
                  <p className="font-semibold text-white text-sm">{i + 1}. {n.title}</p>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{n.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Protections */}
        <Card className="mt-6 border border-white/10 bg-[#090f1e]/90 backdrop-blur-xl p-6 text-slate-100 shadow-2xl rounded-2xl">
          <h2 className="mb-3 text-2xl font-normal text-white flex items-center gap-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
            <ShieldCheck className="size-5 text-cyan-400" /> Escrow Protections
          </h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {protections.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate('/dashboard')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-8 py-3 rounded-xl shadow-lg">
            Go to My Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/mentors')} className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 px-6 py-3 rounded-xl">
            Browse More Mentors
          </Button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-[#020b18] p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-white mt-0.5">{value}</p>
    </div>
  );
}
