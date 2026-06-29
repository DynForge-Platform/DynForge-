import {
  Users, User, TrendingUp, Wallet, Clock, AlertTriangle, ArrowRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  adminUsers, transactions, disputes, revenueTrend, mentors, formatCurrency,
} from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { KpiCard } from '../../components/cards';
import { StatusBadge } from '../../components/common';
import { useNavigate } from 'react-router';

export function AdminOverview() {
  const navigate = useNavigate();
  const totalRevenue = transactions.reduce((s, t) => s + t.amount, 0);
  const totalCommission = transactions.reduce((s, t) => s + t.commission, 0);
  const pendingPayouts = transactions.filter((t) => t.status === 'Pending Payout').reduce((s, t) => s + t.amount - t.commission, 0);
  const openDisputes = disputes.filter((d) => d.status === 'Open' || d.status === 'Under Review').length;
  const activeStudents = adminUsers.filter((u) => u.role === 'Student' && u.status === 'Active').length;
  const activeMentors = adminUsers.filter((u) => u.role === 'Mentor' && u.status === 'Active').length;

  const compact = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M₫` : formatCurrency(v);

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Platform overview — revenue, users, verifications, and disputes.</p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Total students" value={String(activeStudents)} icon={Users} />
        <KpiCard label="Active mentors" value={String(activeMentors)} icon={User} />
        <KpiCard label="Total revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} tone="success" />
        <KpiCard label="Platform commission" value={formatCurrency(totalCommission)} icon={Wallet} tone="success" />
        <KpiCard label="Pending payouts" value={formatCurrency(pendingPayouts)} icon={Clock} tone="warning" />
        <KpiCard label="Open disputes" value={String(openDisputes)} icon={AlertTriangle} tone="warning" />
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
              <AreaChart data={revenueTrend} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis key="x" dataKey="month" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis key="y" tickFormatter={compact} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} width={48} />
                <Tooltip key="tip" formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)' }} />
                <Area key="area-rev" type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#arev)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pending verifications */}
        <Card className="border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Pending verifications</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/admin/verification')}>
              Review all <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {mentors.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p style={{ fontWeight: 500 }}>{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.university}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={m.verified ? 'Completed' : 'Upcoming'} />
                  <Button size="sm" variant="outline">Review</Button>
                </div>
              </div>
            ))}
          </div>
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
                <TableHead>ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 5).map((t) => (
                <TableRow key={t.id}>
                  <TableCell style={{ fontWeight: 500 }}>{t.id}</TableCell>
                  <TableCell className="text-muted-foreground">{t.student}</TableCell>
                  <TableCell className="text-muted-foreground">{t.mentor}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
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
