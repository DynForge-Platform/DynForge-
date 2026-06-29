import { useState } from 'react';
import {
  TrendingUp, Wallet, CircleDollarSign, PercentCircle, Download,
  ArrowDownToLine, History, CheckCircle2, ChevronRight, Eye,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { teacherSessions, teacherEarningsTrend, formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import { KpiCard } from '../../components/cards';
import { StatusBadge } from '../../components/common';
import { cn } from '../../components/ui/utils';
import { toast } from 'sonner';

const commission = 0.15;
const quickAmounts = [500000, 1000000, 2000000, 5000000];

const allPayoutHistory = [
  { id: 'PH-001', date: '2026-06-15', amount: 2550000, net: 2167500, method: 'Vietcombank ···· 4521', status: 'Completed', ref: 'TXN-98010', sessions: 3 },
  { id: 'PH-002', date: '2026-05-31', amount: 2500000, net: 2125000, method: 'Vietcombank ···· 4521', status: 'Completed', ref: 'TXN-98001', sessions: 2 },
  { id: 'PH-003', date: '2026-04-30', amount: 2200000, net: 1870000, method: 'Vietcombank ···· 4521', status: 'Completed', ref: 'TXN-97041', sessions: 2 },
  { id: 'PH-004', date: '2026-03-31', amount: 1800000, net: 1530000, method: 'Vietcombank ···· 4521', status: 'Completed', ref: 'TXN-96010', sessions: 1 },
  { id: 'PH-005', date: '2026-03-15', amount: 883000, net: 750000, method: 'Vietcombank ···· 4521', status: 'Failed', ref: 'TXN-95880', sessions: 1 },
];

function WithdrawModal({ balance, onClose }: { balance: number; onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [amount, setAmount] = useState('');
  const num = parseInt(amount.replace(/\D/g, '')) || 0;

  const validate = () => {
    if (num < 100000) { toast.error('Minimum withdrawal is 100.000₫'); return false; }
    if (num > balance) { toast.error('Amount exceeds your available balance.'); return false; }
    return true;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="size-5 text-primary" />
            {step === 'done' ? 'Withdrawal requested' : 'Withdraw earnings'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-accent/50 p-4">
              <p className="text-sm text-muted-foreground">Available for withdrawal</p>
              <p className="mt-0.5 text-success" style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatCurrency(balance)}</p>
            </div>
            <div>
              <Label className="mb-1.5 block">Amount (₫)</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 1000000"
                className="bg-input-background text-lg"
                style={{ fontWeight: 600 }}
                autoFocus
              />
              <p className="mt-1 text-xs text-muted-foreground">Minimum: 100.000₫ · 1–3 business days</p>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Quick select</p>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.filter((q) => q <= balance).map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(String(q))}
                    className={cn('rounded-lg border py-2 text-xs transition-colors', num === q ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent')}
                    style={{ fontWeight: 600 }}
                  >
                    {q >= 1_000_000 ? `${q / 1_000_000}M` : `${q / 1000}K`}₫
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="mb-2 text-sm text-muted-foreground">Withdraw to</p>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10"><ChevronRight className="size-4 text-primary" /></span>
                <div>
                  <p style={{ fontWeight: 600 }}>Vietcombank ···· 4521</p>
                  <p className="text-sm text-muted-foreground">Linh Thi Nguyen · Verified ✓</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={() => { if (validate()) setStep('confirm'); }}>Continue</Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-pale-blue/50 p-5 space-y-3 text-sm">
              {[
                ['Withdraw amount', <span className="text-success" style={{ fontWeight: 700 }}>{formatCurrency(num)}</span>],
                ['Bank', 'Vietcombank'],
                ['Account', '···· 4521 · Linh Thi Nguyen'],
                ['Processing time', '1–3 business days'],
                ['Balance after', formatCurrency(balance - num)],
              ].map(([l, v]) => (
                <div key={String(l)} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{l}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>← Back</Button>
              <Button className="flex-1" onClick={() => setStep('done')}>Confirm withdrawal</Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-9" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>Withdrawal submitted!</p>
              <p className="mt-1 text-muted-foreground">{formatCurrency(num)} will be credited within 1–3 business days.</p>
            </div>
            <Button className="w-full" onClick={onClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function HistoryDetailModal({ payout, onClose }: { payout: typeof allPayoutHistory[0]; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Payout detail — {payout.ref}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {[
            ['Reference', payout.ref],
            ['Date', new Date(payout.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
            ['Gross amount', formatCurrency(payout.amount)],
            ['Platform fee (15%)', `- ${formatCurrency(payout.amount - payout.net)}`],
            ['Net received', formatCurrency(payout.net)],
            ['Bank account', payout.method],
            ['Sessions included', String(payout.sessions)],
            ['Status', payout.status],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-muted-foreground">{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}

export function TeacherEarnings() {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [historyDetail, setHistoryDetail] = useState<typeof allPayoutHistory[0] | null>(null);

  const completed = teacherSessions.filter((s) => s.sessionStatus === 'Completed');
  const totalGross = completed.reduce((s, t) => s + t.amount, 0);
  const totalNet = Math.round(totalGross * (1 - commission));
  const platformFees = totalGross - totalNet;
  const pending = teacherSessions
    .filter((s) => s.paymentStatus === 'In Escrow')
    .reduce((s, t) => s + Math.round(t.amount * (1 - commission)), 0);
  const available = totalNet - pending;

  const compact = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M₫` : formatCurrency(v);

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Earnings</h1>
          <p className="mt-1 text-muted-foreground">Track your income, payouts, and platform commission.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => toast.info('Export feature coming soon.')}>
            <Download className="size-4" /> Export
          </Button>
          <Button className="gap-1.5" onClick={() => setShowWithdraw(true)}>
            <ArrowDownToLine className="size-4" /> Withdraw
          </Button>
        </div>
      </div>

      {/* Quick withdraw CTA */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-accent p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Available for withdrawal</p>
            <p className="text-success" style={{ fontSize: '2rem', fontWeight: 800 }}>{formatCurrency(available)}</p>
            <p className="text-sm text-muted-foreground">To Vietcombank ···· 4521 · 1–3 business days</p>
          </div>
          <Button size="lg" className="gap-1.5" onClick={() => setShowWithdraw(true)}>
            <ArrowDownToLine className="size-4" /> Withdraw now
          </Button>
        </div>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total earnings (net)" value={formatCurrency(totalNet)} icon={TrendingUp} tone="success" />
        <KpiCard label="Pending payout" value={formatCurrency(pending)} icon={Wallet} tone="warning" />
        <KpiCard label="Available to withdraw" value={formatCurrency(available)} icon={CircleDollarSign} />
        <KpiCard label="Platform fees (15%)" value={formatCurrency(platformFees)} icon={PercentCircle} />
      </div>

      {/* Chart */}
      <Card className="mb-6 border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Monthly earnings</h2>
          <span className="text-sm text-muted-foreground">Last 6 months</span>
        </div>
        <div className="h-56">
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="earn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={teacherEarningsTrend} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis key="x" dataKey="month" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis key="y" tickFormatter={compact} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} width={52} />
              <Tooltip key="tip" formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)' }} />
              <Area key="area-earn" type="monotone" dataKey="earnings" stroke="var(--chart-2)" strokeWidth={2} fill="url(#earn)" name="Net earnings" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Session earnings */}
      <Card className="mb-6 border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Session earnings</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completed.map((s) => {
                const gross = s.amount;
                const fee = Math.round(gross * commission);
                const net = gross - fee;
                return (
                  <TableRow key={s.id}>
                    <TableCell style={{ fontWeight: 500 }}>{s.studentName}</TableCell>
                    <TableCell className="text-muted-foreground">{s.course}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(s.dateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.durationMinutes} min</TableCell>
                    <TableCell>{formatCurrency(gross)}</TableCell>
                    <TableCell className="text-muted-foreground">- {formatCurrency(fee)}</TableCell>
                    <TableCell style={{ fontWeight: 600 }} className="text-success">{formatCurrency(net)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Payout history */}
      <Card className="border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            <History className="size-5 text-muted-foreground" /> Payout history
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net received</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPayoutHistory.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(p.amount)}</TableCell>
                  <TableCell style={{ fontWeight: 700 }} className="text-success">{formatCurrency(p.net)}</TableCell>
                  <TableCell className="text-muted-foreground">{p.sessions}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-primary" onClick={() => setHistoryDetail(p)}>
                      <Eye className="size-4" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showWithdraw && <WithdrawModal balance={available} onClose={() => setShowWithdraw(false)} />}
      {historyDetail && <HistoryDetailModal payout={historyDetail} onClose={() => setHistoryDetail(null)} />}
    </div>
  );
}
