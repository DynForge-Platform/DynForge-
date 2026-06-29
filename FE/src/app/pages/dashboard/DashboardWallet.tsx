import { useState } from 'react';
import {
  Wallet, ShieldCheck, TrendingDown, RefreshCcw, Plus, Receipt,
  X, Copy, CheckCircle2, Smartphone, Building2, ChevronRight,
} from 'lucide-react';
import {
  walletBalance, escrowHeld, totalRefunded, totalSpentAmount,
  walletTransactions, sessions, formatCurrency,
} from '../../data/mockData';
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
import { useLanguage } from '../../context/LanguageContext';

// txTabs values are filter keys — keep English for filter logic, translate labels in render

// Fake QR SVG — looks like a real QR without an external dep
function QRPlaceholder({ size = 180 }: { size?: number }) {
  const cells = 21;
  const cell = size / cells;
  // Deterministic "random" pattern seeded from position
  const on = (r: number, c: number) => {
    if (r < 7 && c < 7) return true; // top-left finder
    if (r < 7 && c > cells - 8) return true; // top-right finder
    if (r > cells - 8 && c < 7) return true; // bottom-left finder
    return ((r * 3 + c * 7 + r * c) % 3 === 0);
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <rect width={size} height={size} fill="white" rx={8} />
      {Array.from({ length: cells }).map((_, r) =>
        Array.from({ length: cells }).map((__, c) =>
          on(r, c) ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell + 1}
              y={r * cell + 1}
              width={cell - 1}
              height={cell - 1}
              fill="#0f1c4d"
              rx={1}
            />
          ) : null
        )
      )}
    </svg>
  );
}

// ── Add Funds modal ────────────────────────────────────────────
function AddFundsModal({ onClose }: { onClose: () => void }) {
  const [method, setMethod] = useState<'momo' | 'bank' | null>(null);
  const [amount, setAmount] = useState('200000');
  const [copied, setCopied] = useState(false);
  const accountNo = '0123456789';

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirm = () => {
    toast.success(`Top-up of ${formatCurrency(Number(amount))} confirmed. Your balance will update within a few minutes.`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add Funds to Wallet</DialogTitle>
        </DialogHeader>

        {!method ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select a top-up method:</p>
            <button
              onClick={() => setMethod('momo')}
              className="flex w-full items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#d82d8b]/10">
                  <Smartphone className="size-5 text-[#d82d8b]" />
                </span>
                <div className="text-left">
                  <p style={{ fontWeight: 600 }}>MoMo</p>
                  <p className="text-sm text-muted-foreground">Scan MoMo QR code</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setMethod('bank')}
              className="flex w-full items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="size-5 text-primary" />
                </span>
                <div className="text-left">
                  <p style={{ fontWeight: 600 }}>Chuyển khoản ngân hàng</p>
                  <p className="text-sm text-muted-foreground">VietQR / Internet Banking</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setMethod(null)}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              ← Change method
            </button>

            {/* Amount input */}
            <div>
              <Label className="mb-1.5 block">Amount to top up (₫)</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                className="bg-input-background text-lg"
                style={{ fontWeight: 600 }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {['50000', '100000', '200000', '500000'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className={cn(
                      'rounded-lg border px-3 py-1 text-sm transition-colors',
                      amount === v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    )}
                  >
                    {formatCurrency(Number(v))}
                  </button>
                ))}
              </div>
            </div>

            {/* QR Code */}
            <div className="rounded-2xl border border-border bg-pale-blue/50 p-5 text-center">
              {method === 'momo' ? (
                <>
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <span className="size-3 rounded-full bg-[#d82d8b]" />
                    <span className="text-sm text-[#d82d8b]" style={{ fontWeight: 700 }}>MoMo</span>
                  </div>
                  <QRPlaceholder size={160} />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Open MoMo app → Scan QR → Enter amount <strong>{formatCurrency(Number(amount))}</strong>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reference: <strong>GRADORA {accountNo}</strong>
                    <button onClick={() => copy(`GRADORA ${accountNo}`)} className="ml-2 text-primary">
                      {copied ? <CheckCircle2 className="inline size-3.5" /> : <Copy className="inline size-3.5" />}
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    <span className="text-sm text-primary" style={{ fontWeight: 700 }}>VietQR</span>
                  </div>
                  <QRPlaceholder size={160} />
                  <div className="mt-3 space-y-1.5 text-left text-sm">
                    {[
                      ['Bank', 'Vietcombank'],
                      ['Số tài khoản', accountNo],
                      ['Account holder', 'GRADORA CO. LTD'],
                      ['Amount', formatCurrency(Number(amount))],
                      ['Reference', `GRADORA ${accountNo}`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                        <span className="text-muted-foreground">{label}</span>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontWeight: 600 }}>{value}</span>
                          <button onClick={() => copy(value)} className="text-primary">
                            {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm text-warning">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              After transferring, click "I've transferred" to confirm. Balance updates within 5–10 minutes.
            </div>

            <Button className="w-full" size="lg" onClick={confirm}>
              I've transferred
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Withdraw modal ─────────────────────────────────────────────
function WithdrawModal({ onClose }: { onClose: () => void }) {
  const [method, setMethod] = useState<'momo' | 'bank' | null>(null);
  const [amount, setAmount] = useState('100000');

  const confirm = () => {
    toast.success(`Withdrawal of ${formatCurrency(Number(amount))} requested. Processing within 1–3 business days.`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Withdraw from Wallet</DialogTitle>
        </DialogHeader>

        {!method ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select a withdrawal method:</p>
            <button
              onClick={() => setMethod('momo')}
              className="flex w-full items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#d82d8b]/10">
                  <Smartphone className="size-5 text-[#d82d8b]" />
                </span>
                <div className="text-left">
                  <p style={{ fontWeight: 600 }}>MoMo</p>
                  <p className="text-sm text-muted-foreground">Withdraw to MoMo — instant</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setMethod('bank')}
              className="flex w-full items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="size-5 text-primary" />
                </span>
                <div className="text-left">
                  <p style={{ fontWeight: 600 }}>Tài khoản ngân hàng</p>
                  <p className="text-sm text-muted-foreground">1–3 ngày làm việc</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setMethod(null)}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              ← Change method
            </button>

            <div>
              <Label className="mb-1.5 block">Amount to withdraw (₫)</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                className="bg-input-background text-lg"
                style={{ fontWeight: 600 }}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Available balance: <strong>{formatCurrency(walletBalance)}</strong> · Minimum: 50.000₫
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['50000', '100000', '200000', '500000'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className={cn(
                      'rounded-lg border px-3 py-1 text-sm transition-colors',
                      amount === v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    )}
                  >
                    {formatCurrency(Number(v))}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination */}
            <div className="rounded-2xl border border-border bg-pale-blue/50 p-4">
              {method === 'momo' ? (
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#d82d8b]/10">
                    <Smartphone className="size-5 text-[#d82d8b]" />
                  </span>
                  <div>
                    <p className="text-sm text-muted-foreground">Rút về MoMo</p>
                    <p style={{ fontWeight: 600 }}>0912 345 678 — Nguyễn Văn A</p>
                    <p className="text-xs text-success">✓ Verified</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="size-5 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm text-muted-foreground">Vietcombank</p>
                    <p style={{ fontWeight: 600 }}>···· ···· 6789 — Nguyễn Văn A</p>
                    <p className="text-xs text-success">✓ Verified</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              Funds will be sent to your account after successful processing.
            </div>

            <Button className="w-full" size="lg" onClick={confirm}>
              Confirm withdrawal
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main wallet page ───────────────────────────────────────────
export function DashboardWallet() {
  const { T } = useLanguage();
  const [tab, setTab] = useState('All');
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const escrowSessions = sessions.filter((s) => s.status === 'In Escrow');
  const filtered =
    tab === 'All' ? walletTransactions : walletTransactions.filter((t) => t.type === tab);

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{T.walletTitle}</h1>
        <p className="mt-1 text-muted-foreground">{T.walletSubtitle}</p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={T.availableBalance} value={formatCurrency(walletBalance)} icon={Wallet} />
        <KpiCard label={T.heldInEscrowLabel} value={formatCurrency(escrowHeld)} icon={ShieldCheck} tone="warning" />
        <KpiCard label={T.totalSpentLabel} value={formatCurrency(totalSpentAmount)} icon={TrendingDown} />
        <KpiCard label={T.refunded} value={formatCurrency(totalRefunded)} icon={RefreshCcw} tone="success" />
      </div>

      {/* Main wallet card */}
      <Card className="mb-6 border-border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Available balance</p>
            <p className="mt-1 text-navy" style={{ fontSize: '2.25rem', fontWeight: 800 }}>
              {formatCurrency(walletBalance)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddFunds(true)}>
              <Plus className="size-4" /> {T.addFunds}
            </Button>
            <Button variant="outline" onClick={() => setShowWithdraw(true)}>
              {T.withdraw}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          Payments are protected by escrow — funds are released to your mentor only after session confirmation.
        </div>
      </Card>

      {/* Active escrow */}
      {escrowSessions.length > 0 && (
        <Card className="mb-6 border-border p-6">
          <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            {T.activeEscrow}
          </h2>
          <div className="space-y-3">
            {escrowSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src={s.mentorAvatar}
                    alt={s.mentorName}
                    className="size-10 rounded-full object-cover"
                  />
                  <div>
                    <p style={{ fontWeight: 500 }}>{s.mentorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.course} · {new Date(s.dateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ fontWeight: 700 }}>{formatCurrency(s.amount)}</span>
                  <StatusBadge status={s.status} />
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transaction history */}
      <Card className="border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{T.transactionHistory}</h2>
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="flex-wrap">
            {[
              { key: 'All', label: T.all },
              { key: 'Paid', label: T.paid },
              { key: 'In Escrow', label: T.inEscrow },
              { key: 'Refunded', label: T.refunded },
              { key: 'Failed', label: T.failed },
            ].map((t) => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell><StatusBadge status={t.type} /></TableCell>
                  <TableCell style={{ fontWeight: 500 }}>{t.mentor}</TableCell>
                  <TableCell className="text-muted-foreground">{t.course}</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{t.method}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-primary">
                      <Receipt className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modals */}
      {showAddFunds && <AddFundsModal onClose={() => setShowAddFunds(false)} />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} />}
    </div>
  );
}
