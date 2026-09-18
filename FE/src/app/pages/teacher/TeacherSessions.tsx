import { useState, useEffect, useCallback } from 'react';
import { Video, CheckCircle2, Eye, AlertTriangle, Loader2, Check, X } from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { StatusBadge, EmptyState } from '../../components/common';
import { MeetRoomOverlay } from '../../components/MeetRoomOverlay';
import { CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  getMentorSchedule, markTaught, acceptBooking, declineBooking, mapStatusToDisplay,
  type BookingResponse, type BookingStatus,
} from '../../services/bookingService';

const tabs = ['All', 'Requests', 'Accepted', 'Taught', 'Completed', 'Cancelled'];

function mentorStatusTab(status: BookingStatus): string {
  switch (status) {
    case 'PENDING_PAYMENT': return 'Pending Payment';
    case 'ESCROW_HELD':     return 'Requests';
    case 'ACCEPTED':        return 'Accepted';
    case 'TAUGHT':          return 'Taught';
    case 'COMPLETED':       return 'Completed';
    case 'CANCELLED':       return 'Cancelled';
    case 'REFUNDED':        return 'Cancelled';
    default:                return mapStatusToDisplay(status);
  }
}

export function TeacherSessions() {
  const { user } = useAuth();
  const [tab, setTab] = useState('All');
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [meetBooking, setMeetBooking] = useState<BookingResponse | null>(null);
  const [viewBooking, setViewBooking] = useState<BookingResponse | null>(null);
  const [markDoneBooking, setMarkDoneBooking] = useState<BookingResponse | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<BookingResponse | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getMentorSchedule();
      setBookings(data);
    } catch (err: any) {
      console.error('fetchBookings error:', err);
      toast.error(err?.response?.data?.message ?? 'Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAccept = async (b: BookingResponse) => {
    setActingId(b.id);
    try {
      await acceptBooking(b.id);
      toast.success('Request accepted. The student has been notified.');
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to accept request.');
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (b: BookingResponse) => {
    setActingId(b.id);
    try {
      await declineBooking(b.id);
      toast.success('Request declined. The student has been refunded.');
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to decline request.');
    } finally {
      setActingId(null);
    }
  };

  const withTab = bookings.map((b) => ({ ...b, tabStatus: mentorStatusTab(b.status) }));
  const filtered = tab === 'All' ? withTab : withTab.filter((b) => b.tabStatus === tab);

  const handleMarkDone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markDoneBooking) return;
    try {
      await markTaught(markDoneBooking.id);
      toast.success('Session marked as taught. Waiting for student confirmation.');
      fetchBookings();
      setMarkDoneBooking(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to mark session.');
    }
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Your response has been submitted to DynForge.');
    setDisputeBooking(null);
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Sessions</h1>
        <p className="mt-1 text-muted-foreground">
          Manage student bookings — join, mark as taught, and track completion.
        </p>
      </div>

      <Card className="border-border p-5">
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="flex-wrap">
            {tabs.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading sessions…
          </div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell style={{ fontWeight: 500 }}>{b.courseCode}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(b.startAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      {' · '}
                      {new Date(b.startAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{b.durationMin} min</TableCell>
                    <TableCell className="text-muted-foreground">{b.format.replace('_', '-')}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(b.price)}</TableCell>
                    <TableCell><StatusBadge status={b.tabStatus} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {b.status === 'ESCROW_HELD' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-danger border-danger/30 hover:bg-danger/5"
                              disabled={actingId === b.id}
                              onClick={() => handleDecline(b)}
                            >
                              <X className="size-3.5" /> Decline
                            </Button>
                            <Button
                              size="sm"
                              disabled={actingId === b.id}
                              onClick={() => handleAccept(b)}
                            >
                              {actingId === b.id
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <><Check className="size-3.5" /> Accept</>}
                            </Button>
                          </>
                        )}
                        {b.status === 'ACCEPTED' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setViewBooking(b)}>
                              <Eye className="size-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setMarkDoneBooking(b)}>
                              Mark done
                            </Button>
                            <Button size="sm" className="gap-1.5" onClick={() => setMeetBooking(b)}>
                              <Video className="size-3.5" /> Join
                            </Button>
                          </>
                        )}
                        {(b.status === 'COMPLETED' || b.status === 'TAUGHT') && (
                          <Button size="sm" variant="outline" onClick={() => setViewBooking(b)}>
                            <Eye className="size-3.5" /> View
                          </Button>
                        )}
                        {b.status === 'DISPUTED' && (
                          <Button size="sm" variant="outline" className="text-warning border-warning/30" onClick={() => setDisputeBooking(b)}>
                            <AlertTriangle className="size-3.5" /> Respond
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={CalendarCheck}
            title={`No ${tab.toLowerCase()} sessions`}
            description="Sessions from students will appear here once they book with you."
          />
        )}
      </Card>

      {/* Meet room */}
      {meetBooking && (
        <MeetRoomOverlay
          bookingId={meetBooking.id}
          course={meetBooking.courseCode}
          partnerName={meetBooking.menteeName ?? 'Student'}
          durationMinutes={meetBooking.durationMin}
          displayName={user?.name}
          onClose={() => setMeetBooking(null)}
        />
      )}

      {/* View detail */}
      {viewBooking && (
        <Dialog open onOpenChange={() => setViewBooking(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader><DialogTitle>Session details</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontWeight: 600 }}>{viewBooking.courseCode}</p>
                  <p className="text-sm text-muted-foreground">{viewBooking.format.replace('_', '-')}</p>
                </div>
                <StatusBadge status={mapStatusToDisplay(viewBooking.status)} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Date', new Date(viewBooking.startAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
                  ['Time', new Date(viewBooking.startAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })],
                  ['Duration', `${viewBooking.durationMin} min`],
                  ['Your payout', formatCurrency(Math.round(viewBooking.price * (1 - viewBooking.commissionRate)))],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border p-3">
                    <p className="text-muted-foreground">{label}</p>
                    <p style={{ fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewBooking(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Mark done modal */}
      {markDoneBooking && (
        <Dialog open onOpenChange={() => setMarkDoneBooking(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-success" /> Mark session as taught
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleMarkDone} className="space-y-4">
              <div className="rounded-xl border border-border p-4">
                <p style={{ fontWeight: 600 }}>{markDoneBooking.courseCode} · {markDoneBooking.durationMin} min</p>
                <p className="text-sm text-muted-foreground">{new Date(markDoneBooking.startAt).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}</p>
              </div>
              <div>
                <Label className="mb-1.5 block">Session notes <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea placeholder="Add notes about what was covered, homework given, or follow-up..." rows={3} />
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                Marking as taught notifies the student to confirm. {formatCurrency(Math.round(markDoneBooking.price * (1 - markDoneBooking.commissionRate)))} will be credited once confirmed.
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setMarkDoneBooking(null)}>Cancel</Button>
                <Button type="submit">Confirm completion</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Respond to dispute */}
      {disputeBooking && (
        <Dialog open onOpenChange={() => setDisputeBooking(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-warning" /> Respond to dispute
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div className="rounded-xl border border-border bg-accent/40 p-4">
                <p style={{ fontWeight: 600 }}>{disputeBooking.courseCode}</p>
                <StatusBadge status={mapStatusToDisplay(disputeBooking.status)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Your response</Label>
                <Textarea placeholder="Explain your side of the situation clearly and factually. DynForge will review both sides fairly." rows={4} required />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDisputeBooking(null)}>Cancel</Button>
                <Button type="submit">Submit response</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
