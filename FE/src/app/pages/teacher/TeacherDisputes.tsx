import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, RefreshCcw, ShieldCheck, Loader2, Eye } from 'lucide-react';
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
  getMentorSchedule, mapStatusToDisplay, type BookingResponse,
} from '../../services/bookingService';

export function TeacherDisputes() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BookingResponse | null>(null);

  useEffect(() => {
    getMentorSchedule()
      .then(setBookings)
      .catch(() => toast.error('Failed to load disputes.'))
      .finally(() => setLoading(false));
  }, []);

  // Disputes raised against this mentor's sessions.
  const disputes = useMemo(
    () => bookings.filter((b) => b.status === 'DISPUTED' || b.status === 'REFUNDED'),
    [bookings],
  );

  const counts = {
    open: disputes.filter((d) => d.status === 'DISPUTED').length,
    refunded: disputes.filter((d) => d.status === 'REFUNDED').length,
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Disputes</h1>
        <p className="mt-1 text-muted-foreground">
          Student complaints raised against your sessions. GRADORA reviews and resolves each case.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Open" value={String(counts.open)} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Refunded" value={String(counts.refunded)} icon={RefreshCcw} tone="success" />
        <KpiCard label="Total value" value={formatCurrency(disputes.reduce((s, d) => s + d.price, 0))} icon={ShieldCheck} />
      </div>

      <Card className="border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Dispute cases</h2>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading disputes…
          </div>
        ) : disputes.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell style={{ fontWeight: 500 }}>{d.menteeName ?? 'Student'}</TableCell>
                    <TableCell className="text-muted-foreground">{d.courseCode}</TableCell>
                    <TableCell className="text-muted-foreground">{d.disputeIssueType ?? '—'}</TableCell>
                    <TableCell className="max-w-[220px] text-muted-foreground">
                      <span className="line-clamp-2" title={d.disputeReason ?? ''}>{d.disputeReason ?? '—'}</span>
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(d.price)}</TableCell>
                    <TableCell><StatusBadge status={mapStatusToDisplay(d.status)} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(d)}>
                        <Eye className="size-4" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="No disputes"
            description="No student disputes have been raised against your sessions."
          />
        )}
      </Card>

      {/* Detail dialog (view-only — admin resolves) */}
      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Dispute — {selected.courseCode}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Student</p>
                  <p style={{ fontWeight: 500 }}>{selected.menteeName ?? 'Student'}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Amount in escrow</p>
                  <p style={{ fontWeight: 500 }}>{formatCurrency(selected.price)}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Issue type</p>
                  <p style={{ fontWeight: 500 }}>{selected.disputeIssueType ?? '—'}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Status</p>
                  <StatusBadge status={mapStatusToDisplay(selected.status)} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Student's reason</p>
                <div className="rounded-xl border border-border bg-accent/50 p-3 whitespace-pre-wrap">
                  {selected.disputeReason ?? 'No reason provided.'}
                </div>
              </div>
              <p className="rounded-xl bg-warning/10 p-3 text-warning">
                GRADORA is reviewing this case and will release the escrow to you or refund the student.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
