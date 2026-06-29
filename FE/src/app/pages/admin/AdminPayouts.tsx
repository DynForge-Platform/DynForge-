import { useState } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { transactions, mentors, adminUsers, formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { StatusBadge } from '../../components/common';
import { toast } from 'sonner';

const pending = transactions.filter((t) => t.status === 'Pending Payout');
const payoutRows = pending.map((t) => {
  const mentor = mentors.find((m) => m.name === t.mentor);
  return { ...t, net: t.amount - t.commission, sessions: 1, risk: mentor?.verified ? 'Low' : 'Medium', method: 'Bank Transfer' };
});

const refundable = transactions.filter((t) => t.status === 'In Escrow' || t.status === 'Released');
const students = adminUsers.filter((u) => u.role === 'Student');

const refundReasons = [
  'Session not attended by mentor',
  'Quality concern — session not as described',
  'Technical issue prevented session',
  'Mentor cancelled last minute',
  'Student requested refund (approved)',
  'Dispute resolved in student favour',
  'Other',
];

function riskColor(risk: string) {
  if (risk === 'Low') return 'bg-success/10 text-success border-success/20';
  if (risk === 'Medium') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-danger/10 text-danger border-danger/20';
}

interface RefundTarget {
  txId: string;
  student: string;
  mentor: string;
  amount: number;
}

export function AdminPayouts() {
  const [tab, setTab] = useState('payouts');
  const [refundModal, setRefundModal] = useState<RefundTarget | null>(null);
  const [customRefund, setCustomRefund] = useState(false);
  const totalPending = payoutRows.reduce((s, r) => s + r.net, 0);

  const openRefund = (tx: typeof refundable[0]) =>
    setRefundModal({ txId: tx.id, student: tx.student, mentor: tx.mentor, amount: tx.amount });

  const submitRefund = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Refund issued to ${refundModal?.student}. Amount will appear in their wallet within 24 hours.`);
    setRefundModal(null);
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Payouts &amp; Refunds</h1>
          <p className="mt-1 text-muted-foreground">Process mentor payouts and issue mentee refunds.</p>
        </div>
        {tab === 'payouts' && (
          <Button onClick={() => toast.success(`Processed ${payoutRows.length} payouts totalling ${formatCurrency(totalPending)}.`)}>
            Bulk process all
          </Button>
        )}
        {tab === 'refunds' && (
          <Button variant="outline" className="gap-2" onClick={() => setCustomRefund(true)}>
            <RefreshCcw className="size-4" /> Issue manual refund
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="payouts">Mentor Payouts</TabsTrigger>
          <TabsTrigger value="refunds">Mentee Refunds</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Mentor Payouts tab ─────────────────────────────────── */}
      {tab === 'payouts' && (
        <Card className="border-border p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            {payoutRows.length} pending · Total: <strong>{formatCurrency(totalPending)}</strong>
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Net amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell style={{ fontWeight: 500 }}>{r.mentor}</TableCell>
                    <TableCell className="text-muted-foreground">{r.id}</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>{formatCurrency(r.net)}</TableCell>
                    <TableCell className="text-muted-foreground">{r.method}</TableCell>
                    <TableCell className="text-muted-foreground">{r.sessions}</TableCell>
                    <TableCell>
                      <Badge className={`border ${riskColor(r.risk)}`}>{r.risk}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => toast.success(`Payout of ${formatCurrency(r.net)} processed for ${r.mentor}.`)}>
                        Process
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ── Mentee Refunds tab ─────────────────────────────────── */}
      {tab === 'refunds' && (
        <Card className="border-border p-6">
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            Refunds will be credited to the mentee's GRADORA wallet within 24 hours. Escrow funds will be released back.
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refundable.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell style={{ fontWeight: 500 }}>{t.id}</TableCell>
                    <TableCell className="text-muted-foreground">{t.student}</TableCell>
                    <TableCell className="text-muted-foreground">{t.mentor}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-danger border-danger/30 hover:bg-danger/5"
                        onClick={() => openRefund(t)}
                      >
                        <RefreshCcw className="size-3.5" /> Refund
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ── Refund dialog ──────────────────────────────────────── */}
      {refundModal && (
        <Dialog open onOpenChange={() => setRefundModal(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCcw className="size-5 text-danger" /> Issue refund to mentee
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={submitRefund} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Transaction', refundModal.txId],
                  ['Student', refundModal.student],
                  ['Mentor', refundModal.mentor],
                  ['Original amount', formatCurrency(refundModal.amount)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border p-3">
                    <p className="text-muted-foreground">{label}</p>
                    <p style={{ fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>
              <div>
                <Label className="mb-1.5 block">Refund amount (₫)</Label>
                <Input
                  defaultValue={String(refundModal.amount)}
                  className="bg-input-background"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Max: {formatCurrency(refundModal.amount)} · Leave full amount for complete refund
                </p>
              </div>
              <div>
                <Label className="mb-1.5 block">Refund reason</Label>
                <Select>
                  <SelectTrigger className="bg-input-background"><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    {refundReasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Admin note <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea placeholder="Internal note for this refund decision..." rows={2} />
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-danger/5 border border-danger/20 p-3 text-sm text-danger">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                This action is irreversible. The mentee will be notified and funds credited to their wallet.
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setRefundModal(null)}>Cancel</Button>
                <Button type="submit" variant="destructive">
                  <RefreshCcw className="size-4" /> Confirm refund
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Manual refund dialog ───────────────────────────────── */}
      {customRefund && (
        <Dialog open onOpenChange={() => setCustomRefund(false)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Issue manual refund</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); toast.success('Manual refund issued.'); setCustomRefund(false); }} className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Student</Label>
                <Select>
                  <SelectTrigger className="bg-input-background"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Amount (₫)</Label>
                <Input type="number" placeholder="e.g. 120000" className="bg-input-background" required />
              </div>
              <div>
                <Label className="mb-1.5 block">Reason</Label>
                <Select>
                  <SelectTrigger className="bg-input-background"><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    {refundReasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Note</Label>
                <Textarea placeholder="Describe the reason for this manual refund..." rows={2} />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setCustomRefund(false)}>Cancel</Button>
                <Button type="submit" variant="destructive">Issue refund</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
