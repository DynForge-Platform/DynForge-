import { useState } from 'react';
import {
  Wallet, ShieldCheck, Building2, ArrowDownToLine,
  History, CheckCircle2, ChevronRight, Copy, X,
} from 'lucide-react';
import { teacherSessions, walletTransactions, formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import { KpiCard } from '../../components/cards';
import { StatusBadge } from '../../components/common';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { cn } from '../../components/ui/utils';
import { toast } from 'sonner';

const commission = 0.15;

const quickAmounts = [500000, 1000000, 2000000, 5000000];

const allPayoutHistory = [
  { id: 'PH-001', date: '2026-06-15', amount: 2550000, method: 'Vietcombank ···· 4521', status: 'Completed', ref: 'TXN-98010' },
  { id: 'PH-002', date: '2026-05-31', amount: 2125000, method: 'Vietcombank ···· 4521', status: 'Completed', ref: 'TXN-98001' },
  { id: 'PH-003', date: '2026-04-30', amount: 1870000, method: 'Vietcombank ···· 4521', status: 'Completed', ref: 'TXN-97041' },
  { id: 'PH-004', date: '2026-03-31', amount: 1530000, method: 'Vietcombank ···· 4521', status: 'Completed', ref: 'TXN-96010' },
  { id: 'PH-005', date: '2026-03-15', amount: 750000, method: 'Vietcombank ···· 4521', status: 'Failed', ref: 'TXN-95880' },
  { id: 'PH-006', date: '2026-02-28', amount: 1200000, method: 'Vietcombank ···· 4521', status: 'Completed', ref: 'TXN-95100' },
];

// ── Withdraw modal ─────────────────────────────────────────────
function WithdrawModal({ balance, onClose }: { balance: number; onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [amount, setAmount] = useState('');
  const num = parseInt(amount.replace(/\D/g, '')) || 0;

  const validate = () => {
    if (num < 100000) { toast.error('Minimum withdrawal is 100.000₫'); return false; }
    if (num > balance) { toast.error('Amount exceeds your available balance.'); return false; }
    return true;
  };

  const toConfirm = () => { if (validate()) setStep('confirm'); };

  const submit = () => {
    setStep('done');
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
              <p className="text-sm text-muted-foreground">Available balance</p>
              <p className="mt-0.5 text-success" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                {formatCurrency(balance)}
              </p>
            </div>

            <div>
              <Label className="mb-1.5 block">Amount to withdraw (₫)</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 1000000"
                className="bg-input-background text-lg"
                style={{ fontWeight: 600 }}
                autoFocus
              />
              <p className="mt-1 text-xs text-muted-foreground">Minimum: 100.000₫ · Processing: 1–3 business days</p>
            </div>

            <div>
              <p className="mb-2 text-sm text-muted-foreground">Quick select</p>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.filter((q) => q <= balance).map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(String(q))}
                    className={cn(
                      'rounded-lg border py-2 text-xs transition-colors',
                      num === q ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    )}
                    style={{ fontWeight: 600 }}
                  >
                    {q >= 1_000_000 ? `${q / 1_000_000}M` : `${q / 1000}K`}₫
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <p className="mb-1 text-sm text-muted-foreground">Withdraw to</p>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-4" />
                </span>
                <div>
                  <p style={{ fontWeight: 600 }}>Vietcombank ···· 4521</p>
                  <p className="text-sm text-muted-foreground">Linh Thi Nguyen · Verified ✓</p>
                </div>
                <ChevronRight className="ml-auto size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={toConfirm} disabled={num < 100000}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-pale-blue/50 p-5 space-y-3 text-sm">
              <Row label="Withdraw amount" value={<span className="text-success" style={{ fontWeight: 700, fontSize: '1.125rem' }}>{formatCurrency(num)}</span>} />
              <Row label="Bank" value="Vietcombank" />
              <Row label="Account" value="···· 4521 · Linh Thi Nguyen" />
              <Row label="Processing time" value="1–3 business days" />
              <Row label="Balance after" value={formatCurrency(balance - num)} />
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm text-warning">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              Funds under active disputes are not included in your available balance.
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>← Back</Button>
              <Button className="flex-1" onClick={submit}>Confirm withdrawal</Button>
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
              <p className="mt-1 text-muted-foreground">
                {formatCurrency(num)} will be credited to Vietcombank ···· 4521 within 1–3 business days.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-accent/50 p-4 text-sm text-left space-y-2">
              <Row label="Reference" value={`WD-${Date.now().toString().slice(-6)}`} />
              <Row label="Status" value="Processing" />
            </div>
            <Button className="w-full" onClick={onClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── History modal ──────────────────────────────────────────────
function HistoryModal({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5 text-primary" /> Payout history
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bank account</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPayoutHistory.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell style={{ fontWeight: 700 }}>{formatCurrency(p.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{p.method}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{p.ref}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export function TeacherWallet() {
  const [tab, setTab] = useState('All');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const completed = teacherSessions.filter((s) => s.sessionStatus === 'Completed');
  const netBalance = Math.round(completed.reduce((s, t) => s + t.amount * (1 - commission), 0));
  const pendingEscrow = teacherSessions
    .filter((s) => s.paymentStatus === 'In Escrow')
    .reduce((s, t) => s + Math.round(t.amount * (1 - commission)), 0);

  const txTabs = ['All', 'Paid', 'In Escrow', 'Refunded'];
  const filtered = tab === 'All' ? walletTransactions : walletTransactions.filter((t) => t.type === tab);

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Wallet &amp; Payouts</h1>
        <p className="mt-1 text-muted-foreground">View your balance, pending escrow, and payout options.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <KpiCard label="Available balance" value={formatCurrency(netBalance)} icon={Wallet} tone="success" />
        <KpiCard label="Pending escrow release" value={formatCurrency(pendingEscrow)} icon={ShieldCheck} tone="warning" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Balance card */}
        <Card className="border-border p-6">
          <p className="text-sm text-muted-foreground">Your wallet balance</p>
          <p className="mt-1 text-navy" style={{ fontSize: '2.25rem', fontWeight: 800 }}>
            {formatCurrency(netBalance)}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button className="gap-1.5" onClick={() => setShowWithdraw(true)}>
              <ArrowDownToLine className="size-4" /> Withdraw
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={() => setShowHistory(true)}>
              <History className="size-4" /> View history
            </Button>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            Escrow-protected: student payments are released to you only after session confirmation.
          </div>
        </Card>

        {/* Bank card */}
        <Card className="border-border p-6">
          <h2 className="mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
            <Building2 className="size-5 text-muted-foreground" /> Bank account
          </h2>
          <div className="rounded-xl border border-border bg-accent/50 p-4">
            <p className="text-sm text-muted-foreground">Linked account</p>
            <p className="mt-1" style={{ fontWeight: 600 }}>Vietcombank ···· 4521</p>
            <p className="text-sm text-muted-foreground">Linh Thi Nguyen</p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="size-3" /> Verified
            </span>
          </div>
          <Button variant="outline" className="mt-3 w-full" size="sm">
            Change bank account
          </Button>
        </Card>
      </div>

      {/* Pending escrow */}
      {teacherSessions.filter((s) => s.paymentStatus === 'In Escrow').length > 0 && (
        <Card className="mb-6 border-border p-6">
          <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Pending escrow releases</h2>
          <div className="space-y-3">
            {teacherSessions.filter((s) => s.paymentStatus === 'In Escrow').map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <ImageWithFallback src={s.studentAvatar} alt={s.studentName} className="size-10 rounded-full object-cover" />
                  <div>
                    <p style={{ fontWeight: 500 }}>{s.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.course} · {new Date(s.dateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ fontWeight: 700 }}>{formatCurrency(Math.round(s.amount * (1 - commission)))}</span>
                  <StatusBadge status={s.paymentStatus} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transactions */}
      <Card className="border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Transaction history</h2>
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList>{txTabs.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}</TabsList>
        </Tabs>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Student / Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell><StatusBadge status={t.type} /></TableCell>
                  <TableCell className="text-muted-foreground">{t.mentor} · {t.course}</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showWithdraw && <WithdrawModal balance={netBalance} onClose={() => setShowWithdraw(false)} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  );
}
