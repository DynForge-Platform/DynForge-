import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, ShieldCheck, TrendingDown, RefreshCcw, Plus, Receipt,
  X, Copy, CheckCircle2, Smartphone, Building2, ChevronRight, Loader2,
} from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { getWallet, topUp, type TransactionResponse } from '../../services/walletService';
import { useAuth } from '../../context/AuthContext';
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
import { cn } from '../../components/ui/utils';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';

function QRPlaceholder({ size = 180 }: { size?: number }) {
  const cells = 21;
  const cell = size / cells;
  const on = (r: number, c: number) => {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c > cells - 8) return true;
    if (r > cells - 8 && c < 7) return true;
    return ((r * 3 + c * 7 + r * c) % 3 === 0);
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <rect width={size} height={size} fill="white" rx={8} />
      {Array.from({ length: cells }).map((_, r) =>
        Array.from({ length: cells }).map((__, c) =>
          on(r, c) ? (
            <rect key={`${r}-${c}`} x={c * cell + 1} y={r * cell + 1} width={cell - 1} height={cell - 1} fill="#0f1c4d" rx={1} />
          ) : null
        )
      )}
    </svg>
  );
}

// ── Add Funds modal ────────────────────────────────────────────
function AddFundsModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [method, setMethod] = useState<'momo' | 'bank' | null>(null);
  const [amount, setAmount] = useState('200000');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const accountNo = '0123456789';

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirm = async () => {
    const numAmount = Number(amount);
    if (numAmount < 10000) { toast.error('Minimum top-up is 10,000₫'); return; }

    if (user?.id) {
      setLoading(true);
      try {
        await topUp(numAmount);
        toast.success(`Top-up of ${formatCurrency(numAmount)} initiated. Balance updates after payment confirmation.`);
        onSuccess();
        onClose();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Top-up failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      toast.success(`Top-up of ${formatCurrency(numAmount)} confirmed. Your balance will update within a few minutes.`);
      onClose();
    }
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
            <button onClick={() => setMethod(null)} className="flex items-center gap-1 text-sm text-primary hover:underline">
              ← Change method
            </button>

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

            <Button className="w-full" size="lg" onClick={confirm} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "I've transferred"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Withdraw modal ─────────────────────────────────────────────
function WithdrawModal({ onClose, balance }: { onClose: () => void; balance: number }) {
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
            <button onClick={() => setMethod('momo')} className="flex w-full items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#d82d8b]/10"><Smartphone className="size-5 text-[#d82d8b]" /></span>
                <div className="text-left">
                  <p style={{ fontWeight: 600 }}>MoMo</p>
                  <p className="text-sm text-muted-foreground">Withdraw to MoMo — instant</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
            <button onClick={() => setMethod('bank')} className="flex w-full items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10"><Building2 className="size-5 text-primary" /></span>
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
            <button onClick={() => setMethod(null)} className="flex items-center gap-1 text-sm text-primary hover:underline">← Change method</button>
            <div>
              <Label className="mb-1.5 block">Amount to withdraw (₫)</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} className="bg-input-background text-lg" style={{ fontWeight: 600 }} />
              <p className="mt-1 text-sm text-muted-foreground">Available balance: <strong>{formatCurrency(balance)}</strong> · Minimum: 50.000₫</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['50000', '100000', '200000', '500000'].map((v) => (
                  <button key={v} onClick={() => setAmount(v)} className={cn('rounded-lg border px-3 py-1 text-sm transition-colors', amount === v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent')}>
                    {formatCurrency(Number(v))}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-pale-blue/50 p-4">
              {method === 'momo'
                ? <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#d82d8b]/10"><Smartphone className="size-5 text-[#d82d8b]" /></span><div><p className="text-sm text-muted-foreground">Rút về MoMo</p><p style={{ fontWeight: 600 }}>0912 345 678 — Nguyễn Văn A</p><p className="text-xs text-success">✓ Verified</p></div></div>
                : <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10"><Building2 className="size-5 text-primary" /></span><div><p className="text-sm text-muted-foreground">Vietcombank</p><p style={{ fontWeight: 600 }}>···· ···· 6789 — Nguyễn Văn A</p><p className="text-xs text-success">✓ Verified</p></div></div>
              }
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              Funds will be sent to your account after successful processing.
            </div>
            <Button className="w-full" size="lg" onClick={confirm}>Confirm withdrawal</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main wallet page ───────────────────────────────────────────
export function DashboardWallet() {
  const { T } = useLanguage();
  const { user } = useAuth();
  const [tab, setTab] = useState('All');
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getWallet();
      setBalance(data.balance);
      setTransactions(data.transactions ?? []);
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  // compute summary stats
  const escrowHeld = transactions.filter((t) => t.type === 'PAYMENT' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter((t) => t.type === 'PAYMENT').reduce((s, t) => s + t.amount, 0);
  const totalRefunded = transactions.filter((t) => t.type === 'REFUND').reduce((s, t) => s + t.amount, 0);

  const filtered = tab === 'All' ? transactions : transactions.filter((t) => t.type === tab.toUpperCase() || t.status === tab.toUpperCase());

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{T.walletTitle}</h1>
        <p className="mt-1 text-muted-foreground">{T.walletSubtitle}</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={T.availableBalance} value={formatCurrency(balance)} icon={Wallet} />
        <KpiCard label={T.heldInEscrowLabel} value={formatCurrency(escrowHeld)} icon={ShieldCheck} tone="warning" />
        <KpiCard label={T.totalSpentLabel} value={formatCurrency(totalSpent)} icon={TrendingDown} />
        <KpiCard label={T.refunded} value={formatCurrency(totalRefunded)} icon={RefreshCcw} tone="success" />
      </div>

      <Card className="mb-6 border-border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Available balance</p>
            {loading
              ? <div className="mt-1 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Loading…</div>
              : <p className="mt-1 text-navy" style={{ fontSize: '2.25rem', fontWeight: 800 }}>{formatCurrency(balance)}</p>
            }
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

      {/* Transaction history */}
      <Card className="border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{T.transactionHistory}</h2>
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="flex-wrap">
            {[
              { key: 'All', label: T.all },
              { key: 'PAYMENT', label: 'Payments' },
              { key: 'TOPUP', label: 'Top-ups' },
              { key: 'REFUND', label: T.refunded },
              { key: 'PAYOUT', label: 'Payouts' },
            ].map((t) => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading transactions…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No transactions yet.</TableCell>
                  </TableRow>
                ) : filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell><StatusBadge status={t.type} /></TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{t.description}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</TableCell>
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
        )}
      </Card>

      {showAddFunds && <AddFundsModal onClose={() => setShowAddFunds(false)} onSuccess={fetchWallet} />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} balance={balance} />}
    </div>
  );
}
