import { useState } from 'react';
import { Wallet, Clock, TrendingDown, CalendarCheck, Building2, Info } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { KpiCard } from '../../components/cards';
import { StatusBadge } from '../../components/common';
import { formatCurrency } from '../../data/mockData';
import { toast } from 'sonner';

const history = [
  { id: 'WD-001', date: '2026-05-31', amount: 2125000, method: 'Bank Transfer', status: 'Completed', txId: 'TXN-98001' },
  { id: 'WD-002', date: '2026-04-30', amount: 1870000, method: 'Bank Transfer', status: 'Completed', txId: 'TXN-97041' },
  { id: 'WD-003', date: '2026-03-31', amount: 1530000, method: 'Bank Transfer', status: 'Completed', txId: 'TXN-96010' },
  { id: 'WD-004', date: '2026-03-15', amount: 750000, method: 'Bank Transfer', status: 'Failed', txId: 'TXN-95880' },
];

const available = 3400000;
const pendingEscrow = 375000;
const totalWithdrawn = history.filter((h) => h.status === 'Completed').reduce((s, h) => s + h.amount, 0);

export function MentorWithdraw() {
  const [amount, setAmount] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(amount.replace(/\D/g, ''));
    if (!num || num < 100000) {
      toast.error('Minimum withdrawal amount is 100.000₫.');
      return;
    }
    if (num > available) {
      toast.error('Amount exceeds your available balance.');
      return;
    }
    toast.success(`Withdrawal of ${formatCurrency(num)} requested. Processing in 1–3 business days.`);
    setAmount('');
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Withdraw Earnings</h1>
        <p className="mt-1 text-muted-foreground">
          Withdraw your available mentor earnings safely to your verified bank account.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Available Balance" value={formatCurrency(available)} icon={Wallet} tone="success" />
        <KpiCard label="Pending Escrow Release" value={formatCurrency(pendingEscrow)} icon={Clock} tone="warning" />
        <KpiCard label="Total Withdrawn" value={formatCurrency(totalWithdrawn)} icon={TrendingDown} />
        <KpiCard label="Next Payout Date" value="30 June 2026" icon={CalendarCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Withdrawal form */}
        <Card className="border-border p-6">
          <h2 className="mb-5" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Request withdrawal</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Amount (₫)</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500000"
                className="bg-input-background"
                required
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Available: <strong>{formatCurrency(available)}</strong> · Minimum: 100.000₫
              </p>
            </div>
            <div>
              <Label className="mb-1.5 block">Bank account</Label>
              <Select defaultValue="main">
                <SelectTrigger className="bg-input-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Vietcombank ···· 4521 — Linh Thi Nguyen</SelectItem>
                  <SelectItem value="add">+ Add new bank account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Payout method</Label>
              <Select defaultValue="bank">
                <SelectTrigger className="bg-input-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank Transfer (1–3 business days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Note <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. June earnings" className="bg-input-background" />
            </div>
            <Button type="submit" size="lg" className="w-full">Request Withdrawal</Button>
          </form>

          {/* Rules */}
          <div className="mt-5 rounded-xl border border-border bg-accent/50 p-4 text-sm">
            <p className="mb-2 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <Info className="size-4 text-muted-foreground" /> Withdrawal rules
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>· Minimum withdrawal: 100.000₫</li>
              <li>· Processing time: 1–3 business days</li>
              <li>· No platform withdrawal fee</li>
              <li>· Funds under active dispute are held until resolution</li>
            </ul>
          </div>
        </Card>

        {/* Bank card */}
        <div className="space-y-4">
          <Card className="border-border p-5">
            <h2 className="mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <Building2 className="size-5 text-muted-foreground" /> Bank account
            </h2>
            <div className="rounded-xl border border-border bg-accent/50 p-4">
              <p className="text-sm text-muted-foreground">Primary account</p>
              <p style={{ fontWeight: 600 }}>Vietcombank ···· 4521</p>
              <p className="text-sm text-muted-foreground">Linh Thi Nguyen</p>
              <StatusBadge status="Approved" />
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toast.info('Bank account management coming soon.')}>
              Edit bank account
            </Button>
          </Card>
        </div>
      </div>

      {/* History */}
      <Card className="mt-6 border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Withdrawal history</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell style={{ fontWeight: 600 }}>{formatCurrency(h.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{h.method}</TableCell>
                  <TableCell><StatusBadge status={h.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{h.txId}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-primary">Receipt</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
