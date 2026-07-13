import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { KpiCard } from '../../components/cards';
import { StatusBadge, EmptyState } from '../../components/common';
import { toast } from 'sonner';
import {
  listAdminDisputes, resolveDispute,
  type AdminDispute,
} from '../../services/adminService';

export function AdminDisputes() {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminDispute | null>(null);
  const [acting, setActing] = useState(false);

  const openReview = (d: AdminDispute) => {
    setSelected(d);
  };

  const fetchDisputes = () => {
    setLoading(true);
    listAdminDisputes()
      .then(setDisputes)
      .catch(() => toast.error('Failed to load disputes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDisputes(); }, []);

  const decide = async (releaseToMentor: boolean) => {
    if (!selected) return;
    setActing(true);
    try {
      await resolveDispute(selected.bookingId, releaseToMentor);
      toast.success(releaseToMentor
        ? 'Dispute resolved — payment released to mentor.'
        : 'Dispute resolved — student refunded.');
      setSelected(null);
      fetchDisputes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not resolve dispute.');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Dispute Management</h1>
        <p className="mt-1 text-muted-foreground">Review and resolve student–mentor disputes fairly.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Open disputes" value={String(disputes.length)} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Total value" value={formatCurrency(disputes.reduce((s, d) => s + d.price, 0))} icon={AlertTriangle} />
        <KpiCard label="Mentors involved" value={String(new Set(disputes.map((d) => d.mentorId)).size)} icon={AlertTriangle} />
      </div>

      <Card className="border-border p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading disputes…
          </div>
        ) : disputes.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.bookingId}>
                    <TableCell style={{ fontWeight: 500 }}>{d.bookingId.slice(0, 8)}…</TableCell>
                    <TableCell className="text-muted-foreground">{d.menteeName ?? d.menteeId.slice(0, 8)}</TableCell>
                    <TableCell className="text-muted-foreground">{d.mentorName ?? d.mentorId.slice(0, 8)}</TableCell>
                    <TableCell className="text-muted-foreground">{d.courseCode}</TableCell>
                    <TableCell className="max-w-[200px] text-muted-foreground">
                      <span className="line-clamp-2" title={d.reason ?? ''}>{d.issueType ?? d.reason ?? '—'}</span>
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(d.price)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openReview(d)}>Review</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState icon={AlertTriangle} title="No disputes" description="All disputes have been resolved." />
        )}
      </Card>

      {/* Admin decision dialog */}
      {selected && (
        <Dialog open onOpenChange={() => { if (!acting) setSelected(null); }}>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Resolve dispute — {selected.bookingId.slice(0, 8)}…</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Student</p>
                  <p style={{ fontWeight: 500 }}>{selected.menteeName ?? selected.menteeId}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Mentor</p>
                  <p style={{ fontWeight: 500 }}>{selected.mentorName ?? selected.mentorId}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Course</p>
                  <p style={{ fontWeight: 500 }}>{selected.courseCode}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Amount in escrow</p>
                  <p style={{ fontWeight: 500 }}>{formatCurrency(selected.price)}</p>
                </div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground">Issue type</p>
                <p style={{ fontWeight: 500 }}>{selected.issueType ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground mb-1">Student's reason</p>
                <p className="whitespace-pre-wrap">{selected.reason ?? 'No reason provided.'}</p>
              </div>
              <p className="rounded-xl bg-warning/10 p-3 text-warning">
                Choose an outcome: refund the student, or release the escrow to the mentor.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="text-success border-success/30" disabled={acting} onClick={() => decide(false)}>
                {acting ? <Loader2 className="size-4 animate-spin" /> : 'Refund student'}
              </Button>
              <Button disabled={acting} onClick={() => decide(true)}>
                {acting ? <Loader2 className="size-4 animate-spin" /> : 'Release to mentor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
