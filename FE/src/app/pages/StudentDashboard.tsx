import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  CalendarClock, CheckCircle2, Clock, Wallet,
  Video, Mic, MicOff, VideoOff, PhoneOff, MessageSquare,
  Users, MonitorUp, Star, AlertTriangle, ShieldCheck,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '../data/mockData';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { KpiCard } from '../components/cards';
import { StatusBadge, EmptyState } from '../components/common';
import { cn } from '../components/ui/utils';
import { toast } from 'sonner';
import {
  getMyBookings, confirmBooking, disputeBooking,
  mapStatusToDisplay, type BookingResponse, type BookingStatus,
} from '../services/bookingService';

const issueTypes = [
  'Session not attended',
  'Quality concern',
  'Refund request',
  'Technical issue',
  'Mentor misconduct',
  'Other',
];

// ── Meet room ─────────────────────────────────────────────────
function MeetRoom({ booking, onClose }: { booking: BookingResponse; onClose: () => void }) {
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [elapsed, setElapsed] = useState('00:00');

  useState(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(s / 60).toString().padStart(2, '0');
      const sec = (s % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${sec}`);
    }, 1000);
    return () => clearInterval(id);
  });

  const end = () => {
    toast.success('Session ended. Please mark it as completed.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f1117]">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white text-xs" style={{ fontWeight: 700 }}>G</span>
          <div>
            <p className="text-sm text-white" style={{ fontWeight: 600 }}>{booking.courseCode}</p>
            <p className="text-xs text-white/50">Booking #{booking.id.slice(-6)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-danger/20 px-3 py-1 text-xs text-red-400">
            <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
            LIVE · {elapsed}
          </span>
        </div>
      </div>
      <div className="flex flex-1 gap-3 px-6 pb-4 min-h-0">
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-[#1c1f2e] flex items-center justify-center">
          <div className="text-white/30 text-sm">Mentor camera</div>
        </div>
        <div className="relative w-48 overflow-hidden rounded-2xl bg-[#1c1f2e] self-end">
          <div className="flex aspect-video items-center justify-center">
            {cam
              ? <div className="flex size-14 items-center justify-center rounded-full bg-primary/30 text-white text-2xl" style={{ fontWeight: 700 }}>Y</div>
              : <VideoOff className="size-8 text-white/30" />}
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-white/60">You</div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 pb-8">
        <ControlBtn icon={mic ? Mic : MicOff} active={mic} onClick={() => setMic(!mic)} label={mic ? 'Mute' : 'Unmute'} />
        <ControlBtn icon={cam ? Video : VideoOff} active={cam} onClick={() => setCam(!cam)} label={cam ? 'Stop video' : 'Start video'} />
        <ControlBtn icon={MessageSquare} onClick={() => toast.info('Chat — coming soon.')} label="Chat" />
        <ControlBtn icon={Users} onClick={() => toast.info('Participants.')} label="Participants" />
        <ControlBtn icon={MonitorUp} onClick={() => toast.info('Screen share — coming soon.')} label="Share screen" />
        <button onClick={end} className="flex flex-col items-center gap-1 rounded-2xl bg-danger px-6 py-3 text-white transition-opacity hover:opacity-90">
          <PhoneOff className="size-5" />
          <span className="text-xs" style={{ fontWeight: 500 }}>End</span>
        </button>
      </div>
    </div>
  );
}

function ControlBtn({ icon: Icon, active = true, onClick, label }: { icon: React.ElementType; active?: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={cn('flex flex-col items-center gap-1 rounded-2xl px-5 py-3 transition-colors', active ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-white/40 hover:bg-white/10')}>
      <Icon className="size-5" />
      <span className="text-xs" style={{ fontWeight: 500 }}>{label}</span>
    </button>
  );
}

// ── Confirm modal ──────────────────────────────────────────────
function ConfirmModal({ booking, onClose, onConfirmed }: { booking: BookingResponse; onClose: () => void; onConfirmed: () => void }) {
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmBooking(booking.id);
      toast.success('Session confirmed! Payment released to mentor.');
      onConfirmed();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to confirm session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Confirm session completed</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-xl border border-border p-4 space-y-1">
            <p style={{ fontWeight: 600 }}>{booking.courseCode}</p>
            <p className="text-sm text-muted-foreground">{new Date(booking.startAt).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })} · {booking.durationMin} min</p>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            Confirming releases {formatCurrency(Math.round(booking.price * 0.85))} to the mentor's wallet. This action cannot be undone.
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Confirm & release payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Dispute modal ──────────────────────────────────────────────
function DisputeModal({ booking, onClose, onDisputed }: { booking: BookingResponse; onClose: () => void; onDisputed: () => void }) {
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await disputeBooking(booking.id);
      toast.success('Dispute opened. GRADORA will review within 48 hours.');
      onDisputed();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to open dispute.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Open a dispute</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-border p-4">
            <p style={{ fontWeight: 600 }}>{booking.courseCode}</p>
            <p className="text-sm text-muted-foreground">{new Date(booking.startAt).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Issue type</Label>
              <Select>
                <SelectTrigger className="bg-input-background"><SelectValue placeholder="Select issue type" /></SelectTrigger>
                <SelectContent>
                  {issueTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Describe the problem</Label>
              <Textarea placeholder="Please describe what happened in detail..." rows={4} required />
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-accent/60 p-3 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              GRADORA reviews all disputes fairly. Our team will respond within 48 hours.
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Submit Dispute'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── View modal ─────────────────────────────────────────────────
function ViewModal({ booking, onClose }: { booking: BookingResponse; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Session details</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontWeight: 600 }}>{booking.courseCode}</p>
              <p className="text-sm text-muted-foreground">{booking.format.replace('_', ' ')}</p>
            </div>
            <StatusBadge status={mapStatusToDisplay(booking.status)} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Date', new Date(booking.startAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
              ['Time', new Date(booking.startAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })],
              ['Duration', `${booking.durationMin} minutes`],
              ['Format', booking.format.replace('_', '-')],
              ['Amount', formatCurrency(booking.price)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground">{label}</p>
                <p style={{ fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>
          {booking.status === 'ESCROW_HELD' && (
            <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              Payment is securely held in escrow and will be released after session confirmation.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Status helpers ─────────────────────────────────────────────
const DISPLAY_TO_TAB: Record<string, string> = {
  'Pending Payment': 'Pending Payment',
  'In Escrow': 'In Escrow',
  'Taught': 'Taught',
  'Completed': 'Completed',
  'Disputed': 'Disputed',
  'Refunded': 'Refunded',
  'Cancelled': 'Cancelled',
};

// ── Main dashboard ─────────────────────────────────────────────
export function StudentDashboard() {
  const { T } = useLanguage();
  const { user } = useAuth();
  const [tab, setTab] = useState('All');
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [meetBooking, setMeetBooking] = useState<BookingResponse | null>(null);
  const [viewBooking, setViewBooking] = useState<BookingResponse | null>(null);
  const [confirmBookingItem, setConfirmBookingItem] = useState<BookingResponse | null>(null);
  const [disputeBookingItem, setDisputeBookingItem] = useState<BookingResponse | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch {
      // fallback: keep empty
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const displayedBookings = bookings.map((b) => ({ ...b, displayStatus: mapStatusToDisplay(b.status) }));
  const filtered = tab === 'All' ? displayedBookings : displayedBookings.filter((b) => b.displayStatus === tab);

  const upcoming = bookings.filter((b) => b.status === 'ESCROW_HELD').length;
  const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
  const totalHours = bookings.filter((b) => b.status === 'COMPLETED').reduce((sum, b) => sum + b.durationMin / 60, 0);
  const totalSpent = bookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'PENDING_PAYMENT').reduce((sum, b) => sum + b.price, 0);

  function handleAction(b: BookingResponse) {
    switch (b.status) {
      case 'ESCROW_HELD': setMeetBooking(b); break;
      case 'TAUGHT': setConfirmBookingItem(b); break;
      case 'COMPLETED': setViewBooking(b); break;
      default: setViewBooking(b);
    }
  }

  function actionLabel(status: BookingStatus) {
    switch (status) {
      case 'ESCROW_HELD': return T.join ?? 'Join';
      case 'TAUGHT': return 'Confirm';
      case 'COMPLETED': return T.review ?? 'Review';
      default: return T.view ?? 'View';
    }
  }

  function actionVariant(status: BookingStatus): 'default' | 'outline' | 'destructive' {
    if (status === 'ESCROW_HELD') return 'default';
    if (status === 'TAUGHT') return 'default';
    return 'outline';
  }

  const tabs = [
    { value: 'All', label: T.all ?? 'All' },
    { value: 'Pending Payment', label: 'Pending Payment' },
    { value: 'In Escrow', label: T.inEscrow ?? 'In Escrow' },
    { value: 'Taught', label: 'Taught' },
    { value: 'Completed', label: T.completed ?? 'Completed' },
    { value: 'Cancelled', label: T.cancelled ?? 'Cancelled' },
  ];

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="mb-1" style={{ fontSize: '1.75rem', fontWeight: 700 }}>{T.mySessionsTitle}</h1>
      <p className="mb-6 text-muted-foreground">{T.mySessionsSubtitle}</p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={T.upcoming ?? 'Upcoming'} value={String(upcoming)} icon={CalendarClock} />
        <KpiCard label={T.completed ?? 'Completed'} value={String(completed)} icon={CheckCircle2} tone="success" />
        <KpiCard label={T.hoursLearned ?? 'Hours learned'} value={`${totalHours.toFixed(1)}h`} icon={Clock} tone="warning" />
        <KpiCard label={T.totalSpent ?? 'Total spent'} value={formatCurrency(totalSpent)} icon={Wallet} />
      </div>

      <Card className="border-border p-5">
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="flex-wrap">
            {tabs.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
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
                    <TableCell><StatusBadge status={b.displayStatus} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant={actionVariant(b.status)} onClick={() => handleAction(b)}
                          className={b.status === 'ESCROW_HELD' ? 'gap-1.5' : ''}>
                          {b.status === 'ESCROW_HELD' && <Video className="size-3.5" />}
                          {actionLabel(b.status)}
                        </Button>
                        {b.status === 'TAUGHT' && (
                          <Button size="sm" variant="outline" className="text-danger border-danger/30"
                            onClick={() => setDisputeBookingItem(b)}>
                            Dispute
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
            icon={CalendarClock}
            title={`No ${tab.toLowerCase()} sessions`}
            description="When you book or complete sessions, they will appear here."
          />
        )}
      </Card>

      {meetBooking && <MeetRoom booking={meetBooking} onClose={() => setMeetBooking(null)} />}
      {viewBooking && <ViewModal booking={viewBooking} onClose={() => setViewBooking(null)} />}
      {confirmBookingItem && (
        <ConfirmModal
          booking={confirmBookingItem}
          onClose={() => setConfirmBookingItem(null)}
          onConfirmed={fetchBookings}
        />
      )}
      {disputeBookingItem && (
        <DisputeModal
          booking={disputeBookingItem}
          onClose={() => setDisputeBookingItem(null)}
          onDisputed={fetchBookings}
        />
      )}
    </div>
  );
}
