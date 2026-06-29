import { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Clock,
  PiggyBank,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { transactions, revenueTrend, formatCurrency } from '../data/mockData';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { KpiCard } from '../components/cards';
import { StatusBadge } from '../components/common';
import { toast } from 'sonner';

export function AdminDashboard() {
  const [query, setQuery] = useState('');

  const totalRevenue = transactions.reduce((s, t) => s + t.amount, 0);
  const totalCommission = transactions.reduce((s, t) => s + t.commission, 0);
  const pendingPayouts = transactions.filter((t) => t.status === 'Pending Payout');
  const pendingTotal = pendingPayouts.reduce((s, t) => s + (t.amount - t.commission), 0);

  const filtered = transactions.filter(
    (t) =>
      !query ||
      t.id.toLowerCase().includes(query.toLowerCase()) ||
      t.student.toLowerCase().includes(query.toLowerCase()) ||
      t.mentor.toLowerCase().includes(query.toLowerCase())
  );

  const compact = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M₫` : formatCurrency(v);

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="mb-1" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Commission &amp; Revenue</h1>
      <p className="mb-6 text-muted-foreground">Monitor platform earnings, payouts, and transactions.</p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total revenue" value={formatCurrency(totalRevenue)} delta="+12.5% vs last month" icon={TrendingUp} />
        <KpiCard label="Platform commission" value={formatCurrency(totalCommission)} icon={Wallet} tone="success" />
        <KpiCard label="Pending payouts" value={formatCurrency(pendingTotal)} icon={Clock} tone="warning" />
        <KpiCard label="Net profit estimate" value={formatCurrency(totalCommission)} icon={PiggyBank} tone="success" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Revenue chart */}
        <Card className="border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Revenue trends</h2>
            <span className="text-sm text-muted-foreground">Last 6 months</span>
          </div>
          <div className="h-64">
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="com" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
            </svg>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis key="x" dataKey="month" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis key="y" tickFormatter={compact} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} width={48} />
                <Tooltip key="tip" formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)' }} />
                <Area key="area-rev" type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rev)" name="Revenue" />
                <Area key="area-com" type="monotone" dataKey="commission" stroke="var(--chart-2)" strokeWidth={2} fill="url(#com)" name="Commission" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pending payouts */}
        <Card className="border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Pending payouts</h2>
            <Button size="sm" onClick={() => toast.success(`Processing ${pendingPayouts.length} payouts...`)}>
              Process payouts
            </Button>
          </div>
          <div className="space-y-3">
            {pendingPayouts.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p style={{ fontWeight: 500 }}>{t.mentor}</p>
                  <p className="text-sm text-muted-foreground">{t.id}</p>
                </div>
                <span style={{ fontWeight: 600 }}>{formatCurrency(t.amount - t.commission)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="border-border p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent transactions</h2>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions"
              className="bg-input-background pl-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell style={{ fontWeight: 500 }}>{t.id}</TableCell>
                  <TableCell className="text-muted-foreground">{t.student}</TableCell>
                  <TableCell className="text-muted-foreground">{t.mentor}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell style={{ fontWeight: 500 }}>{formatCurrency(t.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(t.commission)}</TableCell>
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
