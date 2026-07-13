import { useState, useEffect, useMemo } from 'react';
import {
  Users, User, TrendingUp, Wallet, Clock, AlertTriangle, ArrowRight, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { KpiCard } from '../../components/cards';
import { StatusBadge } from '../../components/common';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  getAdminDashboard, listAdminTransactions,
  type AdminDashboard, type AdminTransaction,
} from '../../services/adminService';
import { listVerifications, type VerificationItem } from '../../services/verificationService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildTrend(txns: AdminTransaction[]) {
  const now = new Date();
  const buckets: { key: string; month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTHS[d.getMonth()], revenue: 0 });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  txns.filter((t) => t.type === 'PAYMENT').forEach((t) => {
    const d = new Date(t.createdAt);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (idx.has(k)) buckets[idx.get(k)!].revenue += t.amount;
  });
  return buckets;
}

export function AdminOverview() {
  const navigate = useNavigate();
  const [dash, setDash] = useState<AdminDashboard | null>(null);
  const [txns, setTxns] = useState<AdminTransaction[]>([]);
  const [pendingV, setPendingV] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminDashboard(),
      listAdminTransactions(),
      listVerifications('PENDING').catch(() => []),
    ]).then(([d, t, v]) => {
      setDash(d);
      setTxns(t);
      setPendingV(v);
    }).catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  const trend = useMemo(() => buildTrend(txns), [txns]);
  const compact = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M₫` : formatCurrency(v));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Loading dashboard…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Platform overview — revenue, users, verifications, and disputes.</p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Total students" value={String(dash?.totalMentees ?? 0)} icon={Users} />
        <KpiCard label="Active mentors" value={String(dash?.totalMentors ?? 0)} icon={User} />
        <KpiCard label="Total revenue" value={formatCurrency(dash?.totalRevenue ?? 0)} icon={TrendingUp} tone="success" />
        <KpiCard label="Platform commission" value={formatCurrency(dash?.totalCommission ?? 0)} icon={Wallet} tone="success" />
        <KpiCard label="In escrow" value={formatCurrency(dash?.escrowHeld ?? 0)} icon={Clock} tone="warning" />
        <KpiCard label="Open disputes" value={String(dash?.disputedBookings ?? 0)} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Revenue chart */}
        <Card className="border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Revenue trends</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/admin/commission-revenue')}>
              Full report <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="h-52">
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="arev" x1="0" y1="0" x2="0" y2="1">
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
                <Tooltip key="tip" formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)' }} />
                <Area key="area-rev" type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#arev)" name="Payments in" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pending verifications */}
        <Card className="border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Pending verifications</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/admin/mentor-verification')}>
              Review all <ArrowRight className="size-4" />
            </Button>
          </div>
          {pendingV.length ? (
            <div className="space-y-3">
              {pendingV.slice(0, 4).map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p style={{ fontWeight: 500 }}>{v.userName ?? v.userId}</p>
                    <p className="text-sm text-muted-foreground">{v.course} · {v.claimedGrade}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate('/admin/mentor-verification')}>Review</Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pending verifications.</p>
          )}
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent transactions</h2>
          <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/admin/transactions')}>
            View all <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txns.slice(0, 5).map((t) => (
                <TableRow key={t.id}>
                  <TableCell style={{ fontWeight: 500 }}>{t.userName ?? t.userId.slice(0, 8)}</TableCell>
                  <TableCell className="text-muted-foreground">{t.type}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{t.description}</TableCell>
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
