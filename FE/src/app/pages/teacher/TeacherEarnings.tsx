import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, Wallet, CircleDollarSign, PercentCircle, Download,
  ArrowDownToLine, History, CheckCircle2, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../data/mockData';
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
import { GsapCounter } from '../../components/GsapCounter';
import { StatusBadge, EmptyState } from '../../components/common';
import { cn } from '../../components/ui/utils';
import { toast } from 'sonner';
import {
  getMentorEarnings, type MentorEarningsResponse,
} from '../../services/bookingService';
import {
  getWallet, withdraw, type WalletResponse, type TransactionResponse,
} from '../../services/walletService';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../lib/format';

const quickAmounts = [500000, 1000000, 2000000, 5000000];

function WithdrawModal({
  balance, onClose, onDone, vi,
}: {
  balance: number;
  onClose: () => void;
  onDone: () => void;
  vi: boolean;
}) {
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('Vietcombank');
  const [bankAccount, setBankAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const num = parseInt(amount.replace(/\D/g, '')) || 0;

  const submit = async () => {
    if (num < 50000) { toast.error(vi ? 'Số tiền rút tối thiểu là 50.000₫' : 'Minimum withdrawal is 50.000₫'); return; }
    if (num > balance) { toast.error(vi ? 'Số tiền vượt quá số dư khả dụng.' : 'Amount exceeds your available balance.'); return; }
    if (!bankName.trim() || !bankAccount.trim()) { toast.error(vi ? 'Vui lòng nhập thông tin ngân hàng.' : 'Please enter your bank details.'); return; }
    setSubmitting(true);
    try {
      await withdraw(num, bankName.trim(), bankAccount.trim());
      setStep('done');
      onDone();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Rút tiền thất bại.' : 'Withdrawal failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="size-5 text-primary" />
            {step === 'done' ? (vi ? 'Đã gửi yêu cầu rút tiền' : 'Withdrawal requested') : (vi ? 'Rút thu nhập' : 'Withdraw earnings')}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-accent/50 p-4">
              <p className="text-sm text-muted-foreground">{vi ? 'Khả dụng để rút' : 'Available for withdrawal'}</p>
              <p className="mt-0.5 text-success" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                <GsapCounter targetValue={balance} suffix="₫" />
              </p>
            </div>
            <div>
              <Label className="mb-1.5 block">{vi ? 'Số tiền (₫)' : 'Amount (₫)'}</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder={vi ? 'vd: 1000000' : 'e.g. 1000000'}
                className="bg-input-background text-lg"
                style={{ fontWeight: 600 }}
                autoFocus
              />
              <p className="mt-1 text-xs text-muted-foreground">{vi ? 'Tối thiểu: 50.000₫ · 1–3 ngày làm việc' : 'Minimum: 50.000₫ · 1–3 business days'}</p>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">{vi ? 'Chọn nhanh' : 'Quick select'}</p>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">{vi ? 'Ngân hàng' : 'Bank'}</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="bg-input-background" />
              </div>
              <div>
                <Label className="mb-1.5 block">{vi ? 'Số tài khoản' : 'Account number'}</Label>
                <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder={vi ? 'vd: 0123456789' : 'e.g. 0123456789'} className="bg-input-background" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>{vi ? 'Huỷ' : 'Cancel'}</Button>
              <Button className="flex-1" onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : (vi ? 'Xác nhận rút tiền' : 'Confirm withdrawal')}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-9" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>{vi ? 'Đã gửi yêu cầu rút tiền!' : 'Withdrawal submitted!'}</p>
              <p className="mt-1 text-muted-foreground">{vi ? `${formatCurrency(num)} đã được trừ khỏi ví của bạn.` : `${formatCurrency(num)} has been deducted from your wallet.`}</p>
            </div>
            <Button className="w-full" onClick={onClose}>{vi ? 'Xong' : 'Done'}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_VI = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

function buildTrend(payouts: TransactionResponse[], vi: boolean) {
  const MONTHS = vi ? MONTHS_VI : MONTHS_EN;
  const now = new Date();
  const buckets: { key: string; month: string; earnings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTHS[d.getMonth()], earnings: 0 });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  payouts.forEach((t) => {
    const d = new Date(t.createdAt);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (idx.has(k)) buckets[idx.get(k)!].earnings += t.amount;
  });
  return buckets;
}

export function TeacherEarnings() {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [earnings, setEarnings] = useState<MentorEarningsResponse | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [e, w] = await Promise.all([getMentorEarnings(), getWallet()]);
      setEarnings(e);
      setWallet(w);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Không tải được thu nhập.' : 'Failed to load earnings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const payouts = useMemo(
    () => (wallet?.transactions ?? []).filter((t) => t.type === 'PAYOUT'),
    [wallet],
  );
  const withdrawals = useMemo(
    () => (wallet?.transactions ?? []).filter((t) => t.type === 'WITHDRAWAL'),
    [wallet],
  );
  const trend = useMemo(() => buildTrend(payouts, vi), [payouts, vi]);

  const compact = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M₫` : formatCurrency(v));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> {vi ? 'Đang tải thu nhập…' : 'Loading earnings…'}
      </div>
    );
  }

  const available = earnings?.availableBalance ?? 0;
  const pending = earnings?.pendingClearance ?? 0;
  const totalNet = earnings?.totalEarned ?? 0;
  const platformFees = earnings?.totalCommissionPaid ?? 0;

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Thu nhập' : 'Earnings'}</h1>
          <p className="mt-1 text-muted-foreground">{vi ? 'Theo dõi thu nhập, các khoản giải ngân và hoa hồng nền tảng.' : 'Track your income, payouts, and platform commission.'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => toast.info(vi ? 'Tính năng xuất dữ liệu sắp ra mắt.' : 'Export feature coming soon.')}>
            <Download className="size-4" /> {vi ? 'Xuất' : 'Export'}
          </Button>
          <Button className="gap-1.5" onClick={() => setShowWithdraw(true)} disabled={available <= 0}>
            <ArrowDownToLine className="size-4" /> {vi ? 'Rút tiền' : 'Withdraw'}
          </Button>
        </div>
      </div>

      {/* Quick withdraw CTA */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-accent p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{vi ? 'Khả dụng để rút' : 'Available for withdrawal'}</p>
            <p className="text-success" style={{ fontSize: '2rem', fontWeight: 800 }}>
              <GsapCounter targetValue={available} suffix="₫" />
            </p>
            <p className="text-sm text-muted-foreground">{vi ? 'Rút về tài khoản ngân hàng · 1–3 ngày làm việc' : 'Withdraw to your bank account · 1–3 business days'}</p>
          </div>
          <Button size="lg" className="gap-1.5" onClick={() => setShowWithdraw(true)} disabled={available <= 0}>
            <ArrowDownToLine className="size-4" /> {vi ? 'Rút ngay' : 'Withdraw now'}
          </Button>
        </div>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={vi ? 'Tổng thu nhập (ròng)' : 'Total earnings (net)'} value={formatCurrency(totalNet)} icon={TrendingUp} tone="success" />
        <KpiCard label={vi ? 'Chờ giải ngân' : 'Pending payout'} value={formatCurrency(pending)} icon={Wallet} tone="warning" />
        <KpiCard label={vi ? 'Khả dụng để rút' : 'Available to withdraw'} value={formatCurrency(available)} icon={CircleDollarSign} />
        <KpiCard label={vi ? 'Phí nền tảng đã trả' : 'Platform fees paid'} value={formatCurrency(platformFees)} icon={PercentCircle} />
      </div>

      {/* Chart */}
      <Card className="mb-6 border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{vi ? 'Thu nhập theo tháng' : 'Monthly earnings'}</h2>
          <span className="text-sm text-muted-foreground">{vi ? '6 tháng gần nhất' : 'Last 6 months'}</span>
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
            <AreaChart data={trend} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis key="x" dataKey="month" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis key="y" tickFormatter={compact} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} width={52} />
              <Tooltip key="tip" formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: '#090f1e', color: '#f8fafc' }} />
              <Area key="area-earn" type="monotone" dataKey="earnings" stroke="var(--chart-2)" strokeWidth={2} fill="url(#earn)" name={vi ? 'Thu nhập ròng' : 'Net earnings'} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Session payouts */}
      <Card className="mb-6 border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{vi ? 'Giải ngân theo buổi học' : 'Session payouts'}</h2>
        {payouts.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{vi ? 'Nội dung' : 'Description'}</TableHead>
                  <TableHead>{vi ? 'Ngày' : 'Date'}</TableHead>
                  <TableHead>{vi ? 'Trạng thái' : 'Status'}</TableHead>
                  <TableHead className="text-right">{vi ? 'Thực nhận' : 'Net credited'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell style={{ fontWeight: 500 }}>{t.description}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(t.createdAt, lang, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell style={{ fontWeight: 600 }} className="text-right text-success">{formatCurrency(t.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState icon={TrendingUp} title={vi ? 'Chưa có khoản giải ngân' : 'No payouts yet'} description={vi ? 'Các buổi học đã hoàn tất sẽ hiển thị ở đây khi tiền được giải ngân.' : 'Completed sessions will appear here once payment is released.'} />
        )}
      </Card>

      {/* Withdrawal history */}
      <Card className="border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            <History className="size-5 text-muted-foreground" /> {vi ? 'Lịch sử rút tiền' : 'Withdrawal history'}
          </h2>
        </div>
        {withdrawals.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{vi ? 'Ngày' : 'Date'}</TableHead>
                  <TableHead>{vi ? 'Đích đến' : 'Destination'}</TableHead>
                  <TableHead>{vi ? 'Trạng thái' : 'Status'}</TableHead>
                  <TableHead className="text-right">{vi ? 'Số tiền' : 'Amount'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(t.createdAt, lang, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.description}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell style={{ fontWeight: 700 }} className="text-right">{formatCurrency(t.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState icon={ArrowDownToLine} title={vi ? 'Chưa có giao dịch rút' : 'No withdrawals yet'} description={vi ? 'Lịch sử rút tiền của bạn sẽ hiển thị ở đây.' : 'Your payout history will appear here.'} />
        )}
      </Card>

      {showWithdraw && (
        <WithdrawModal
          balance={available}
          onClose={() => setShowWithdraw(false)}
          onDone={fetchData}
          vi={vi}
        />
      )}
    </div>
  );
}
