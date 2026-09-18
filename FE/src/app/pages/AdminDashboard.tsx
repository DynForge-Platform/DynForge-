import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Wallet, Clock, PiggyBank, Search, Loader2, Percent,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../data/mockData';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { KpiCard } from '../components/cards';
import { GsapCounter } from '../components/GsapCounter';
import { StatusBadge } from '../components/common';
import { toast } from 'sonner';
import {
  getCommissionReport, listAdminTransactions,
  type CommissionReport, type AdminTransaction,
} from '../services/adminService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildTrend(txns: AdminTransaction[]) {
  const now = new Date();
  const buckets: { key: string; month: string; revenue: number; commission: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTHS[d.getMonth()], revenue: 0, commission: 0 });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  txns.forEach((t) => {
    const d = new Date(t.createdAt);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!idx.has(k)) return;
    const b = buckets[idx.get(k)!];
    if (t.type === 'PAYMENT') b.revenue += t.amount;
    if (t.type === 'PAYOUT') b.commission += 0; // commission tracked separately
  });
  return buckets;
}

export function AdminDashboard() {
  const [report, setReport] = useState<CommissionReport | null>(null);
  const [txns, setTxns] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([getCommissionReport(), listAdminTransactions()])
      .then(([r, t]) => { setReport(r); setTxns(t); })
      .catch(() => toast.error('Failed to load commission report.'))
      .finally(() => setLoading(false));
  }, []);

  const trend = useMemo(() => buildTrend(txns), [txns]);
  const filtered = useMemo(
    () => txns.filter((t) =>
      !query || t.id.toLowerCase().includes(query.toLowerCase())
      || (t.userName ?? '').toLowerCase().includes(query.toLowerCase())),
    [txns, query],
  );

  const compact = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M₫` : formatCurrency(v));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Loading commission report…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="mb-1" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Commission &amp; Revenue</h1>
      <p className="mb-6 text-muted-foreground">
        Monitor platform earnings and commission at <GsapCounter targetValue={Math.round((report?.commissionRate ?? 0) * 100)} suffix="%" /> rate.
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Gross volume (GMV)" value={formatCurrency(report?.grossVolume ?? 0)} icon={TrendingUp} />
        <KpiCard label="Commission earned" value={formatCurrency(report?.totalCommissionEarned ?? 0)} icon={Wallet} tone="success" />
        <KpiCard label="Pending commission" value={formatCurrency(report?.pendingCommission ?? 0)} icon={Clock} tone="warning" />
        <KpiCard label="Net profit" value={formatCurrency(report?.totalCommissionEarned ?? 0)} icon={PiggyBank} tone="success" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Payment volume</h2>
            <span className="text-sm text-muted-foreground">Last 6 months</span>
          </div>
          <div className="h-64">
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
            </svg>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis key="x" dataKey="month" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis key="y" tickFormatter={compact} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} width={48} />
                <Tooltip key="tip" formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: '#090f1e', color: '#f8fafc' }} />
                <Area key="area-rev" type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rev)" name="Payments in" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Commission breakdown */}
        <Card className="border-border p-6">
          <h2 className="mb-4 flex items-center gap-2" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            <Percent className="size-5 text-primary" /> Breakdown
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-muted-foreground">Commission rate</span>
              <span style={{ fontWeight: 600 }}>
                <GsapCounter targetValue={Math.round((report?.commissionRate ?? 0) * 100)} suffix="%" />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-muted-foreground">Gross volume</span>
              <span style={{ fontWeight: 600 }}>
                <GsapCounter targetValue={report?.grossVolume ?? 0} suffix="₫" />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-muted-foreground">Commission earned</span>
              <span style={{ fontWeight: 600 }}>
                <GsapCounter targetValue={report?.totalCommissionEarned ?? 0} suffix="₫" />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-muted-foreground">Pending commission</span>
              <span style={{ fontWeight: 600 }}>
                <GsapCounter targetValue={report?.pendingCommission ?? 0} suffix="₫" />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-muted-foreground">Released escrows</span>
              <span style={{ fontWeight: 600 }}>
                <GsapCounter targetValue={report?.releasedCount ?? 0} />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-muted-foreground">Held escrows</span>
              <span style={{ fontWeight: 600 }}>
                <GsapCounter targetValue={report?.heldCount ?? 0} />
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="border-border p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent transactions</h2>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions" className="bg-input-background pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 12).map((t) => (
                <TableRow key={t.id}>
                  <TableCell style={{ fontWeight: 500 }}>{t.userName ?? t.userId.slice(0, 8)}</TableCell>
                  <TableCell className="text-muted-foreground">{t.type}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell style={{ fontWeight: 500 }}>{formatCurrency(t.amount)}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
