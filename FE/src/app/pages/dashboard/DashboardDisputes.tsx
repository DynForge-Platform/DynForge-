import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, RefreshCcw, Plus, Loader2, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { KpiCard } from '../../components/cards';
import { StatusBadge, EmptyState } from '../../components/common';
import { toast } from 'sonner';
import {
  getMyBookings, disputeBooking, mapStatusToDisplay, type BookingResponse,
} from '../../services/bookingService';

const issueTypes = [
  'Session not attended',
  'Quality concern',
  'Refund request',
  'Technical issue',
  'Mentor misconduct',
  'Other',
];

export function DashboardDisputes() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [issueType, setIssueType] = useState(issueTypes[0]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      setBookings(await getMyBookings());
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load disputes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // The mentee's dispute cases = bookings that are disputed or refunded.
  const disputes = useMemo(
    () => bookings.filter((b) => b.status === 'DISPUTED' || b.status === 'REFUNDED'),
    [bookings],
  );
  // Any paid, not-yet-completed session can be disputed.
  const disputable = useMemo(
    () => bookings.filter((b) => b.status === 'ESCROW_HELD' || b.status === 'ACCEPTED' || b.status === 'TAUGHT'),
    [bookings],
  );

  const counts = {
    open: disputes.filter((d) => d.status === 'DISPUTED').length,
    refunded: disputes.filter((d) => d.status === 'REFUNDED').length,
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) { toast.error('Please select a session.'); return; }
    if (!reason.trim()) { toast.error('Please describe the problem.'); return; }
    setSubmitting(true);
    try {
      await disputeBooking(selectedBookingId, issueType, reason.trim());
      toast.success('Dispute submitted. DynForge will review it within 48 hours.');
      setOpen(false);
      setSelectedBookingId('');
      setReason('');
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not open dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Disputes &amp; Complaints</h1>
          <p className="mt-1 text-muted-foreground">
            Open and track support requests for sessions, refunds, or mentor issues.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={disputable.length === 0}>
          <Plus className="size-4" /> Open New Dispute
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Open" value={String(counts.open)} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Refunded" value={String(counts.refunded)} icon={RefreshCcw} tone="success" />
        <KpiCard label="Total value" value={formatCurrency(disputes.reduce((s, d) => s + d.price, 0))} icon={ShieldCheck} />
      </div>

      <Card className="border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>My disputes</h2>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading disputes…
          </div>
        ) : disputes.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell style={{ fontWeight: 500 }}>{d.courseCode}</TableCell>
                    <TableCell className="text-muted-foreground">{d.disputeIssueType ?? '—'}</TableCell>
                    <TableCell className="max-w-[280px] text-muted-foreground">
                      {d.disputeReason
                        ? <span className="line-clamp-2" title={d.disputeReason}>{d.disputeReason}</span>
                        : '—'}
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(d.price)}</TableCell>
                    <TableCell><StatusBadge status={mapStatusToDisplay(d.status)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="No disputes yet"
            description="When something goes wrong with a taught session, you can open a dispute and DynForge will review it fairly."
            action={disputable.length > 0 ? <Button onClick={() => setOpen(true)}>Open a Dispute</Button> : undefined}
          />
        )}
      </Card>

      {/* New dispute dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Open a new dispute</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <Label className="mb-1.5 block">Related session</Label>
              <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                <SelectTrigger><SelectValue placeholder="Select a session" /></SelectTrigger>
                <SelectContent>
                  {disputable.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.courseCode} — {new Date(b.startAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · {formatCurrency(b.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Issue type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger><SelectValue placeholder="Select issue type" /></SelectTrigger>
                <SelectContent>
                  {issueTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Describe the problem</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Please describe what happened in detail…" rows={4} />
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-accent/60 p-3 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              Opening a dispute pauses the payout. DynForge reviews all disputes fairly within 48 hours.
            </div>
            <DialogFooter className="gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Submit Dispute'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
