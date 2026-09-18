import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  CalendarClock, CheckCircle2, Clock, Wallet,
  Video, Mic, MicOff, VideoOff, PhoneOff, MessageSquare,
  Users, MonitorUp, Star, AlertTriangle, ShieldCheck,
  Loader2, Sparkles,
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
import { FormattedText } from '../components/FormattedText';
import { KpiCard } from '../components/cards';
import { StatusBadge, EmptyState } from '../components/common';
import { cn } from '../components/ui/utils';
import { toast } from 'sonner';
import {
  getMyBookings, confirmBooking, disputeBooking,
  mapStatusToDisplay, type BookingResponse, type BookingStatus,
} from '../services/bookingService';
import { createReview } from '../services/reviewService';
import { askSession } from '../services/aiService';
import { MeetRoomOverlay } from '../components/MeetRoomOverlay';

const issueTypes = [
  'Session not attended',
  'Quality concern',
  'Refund request',
  'Technical issue',
  'Mentor misconduct',
  'Other',
];

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
  const [issueType, setIssueType] = useState(issueTypes[0]);
  const [reason, setReason] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Please describe the problem.'); return; }
    setLoading(true);
    try {
      await disputeBooking(booking.id, issueType, reason.trim());
      toast.success('Dispute opened. DynForge will review within 48 hours.');
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
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="bg-input-background"><SelectValue placeholder="Select issue type" /></SelectTrigger>
                <SelectContent>
                  {issueTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Describe the problem</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Please describe what happened in detail..." rows={4} required />
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-accent/60 p-3 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              DynForge reviews all disputes fairly. Our team will respond within 48 hours.
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

// ── Review modal ───────────────────────────────────────────────
function ReviewModal({ booking, onClose, onReviewed }: { booking: BookingResponse; onClose: () => void; onReviewed: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) { toast.error('Please select a star rating.'); return; }
    setLoading(true);
    try {
      await createReview(booking.id, rating, comment.trim() || undefined);
      toast.success('Thanks! Your review has been posted.');
      onReviewed();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Rate your session</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-xl border border-border p-4">
            <p style={{ fontWeight: 600 }}>{booking.courseCode}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(booking.startAt).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })} · {booking.durationMin} min
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  className="p-1"
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star
                    className={cn('size-8 transition-colors', (hover || rating) >= n ? 'fill-warning text-warning' : 'text-muted-foreground/40')}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {rating ? `${rating} / 5` : 'Tap a star to rate'}
            </span>
          </div>
          <div>
            <Label className="mb-1.5 block">Comment <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share how the session went…" rows={3} />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Submit review'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── AI ask (post-session tutor) modal ──────────────────────────
function AskModal({ booking, onClose }: { booking: BookingResponse; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (overrideQ?: string) => {
    const q = (overrideQ ?? input).trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await askSession(booking.id, q);
      setMessages((m) => [...m, { role: 'ai', text: res.answer }]);
      if (res.suggestedQuestions && res.suggestedQuestions.length > 0) {
        setSuggestions(res.suggestedQuestions);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Không hỏi được. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary" /> AI hỏi bài — {booking.courseCode}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[45vh] space-y-3 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Hỏi lại bất kỳ điều gì về buổi học này. Trợ lý DynForge AI sẽ trả lời bám sát nội dung buổi học; nếu cần kèm sâu hơn sẽ gợi ý đặt thêm buổi.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn('rounded-xl p-3 text-sm', m.role === 'user' ? 'ml-8 bg-primary/10' : 'mr-8 bg-accent/60')}>
              {m.role === 'user' ? (
                <p className="whitespace-pre-wrap">{m.text}</p>
              ) : (
                <FormattedText content={m.text} />
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Đang trả lời…
            </div>
          )}
          {suggestions.length > 0 && !loading && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="mb-1.5 text-xs text-muted-foreground font-medium">💡 Gợi ý hỏi tiếp:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sg, idx) => (
                  <button
                    key={idx}
                    onClick={() => send(sg)}
                    className="rounded-lg border border-primary/30 bg-background px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
                  >
                    💬 {sg}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Nhập câu hỏi… (VD: Giải thích lại phần đạo hàm)"
            rows={2}
            className="bg-input-background"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="shrink-0 self-end">Gửi</Button>
        </form>
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
            <div className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm text-warning">
              <Clock className="mt-0.5 size-4 shrink-0" />
              Payment is held safely in escrow. Waiting for the mentor to accept — you'll be able to join once they do.
            </div>
          )}
          {booking.status === 'ACCEPTED' && (
            <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              The mentor has accepted. You can join the session from your sessions list at the scheduled time.
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
  const [reviewBookingItem, setReviewBookingItem] = useState<BookingResponse | null>(null);
  const [askBookingItem, setAskBookingItem] = useState<BookingResponse | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch (err: any) {
      console.error('fetchBookings error:', err);
      toast.error(err?.response?.data?.message ?? 'Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const displayedBookings = bookings.map((b) => ({
    ...b,
    displayStatus: mapStatusToDisplay(b.status),
    // ACCEPTED sits in the "In Escrow" tab (paid & upcoming) but keeps its own badge.
    tabStatus: b.status === 'ACCEPTED' ? 'In Escrow' : mapStatusToDisplay(b.status),
  }));
  const filtered = tab === 'All' ? displayedBookings : displayedBookings.filter((b) => b.tabStatus === tab);

  const upcoming = bookings.filter((b) => b.status === 'ESCROW_HELD' || b.status === 'ACCEPTED').length;
  const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
  const totalHours = bookings.filter((b) => b.status === 'COMPLETED').reduce((sum, b) => sum + b.durationMin / 60, 0);
  const totalSpent = bookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'PENDING_PAYMENT').reduce((sum, b) => sum + b.price, 0);

  function handleAction(b: BookingResponse) {
    switch (b.status) {
      // Paid but the mentor hasn't accepted yet — can't join, just view details.
      case 'ESCROW_HELD': setViewBooking(b); break;
      // Mentor accepted — now the mentee can join the session.
      case 'ACCEPTED': setMeetBooking(b); break;
      case 'TAUGHT': setConfirmBookingItem(b); break;
      case 'COMPLETED': setReviewBookingItem(b); break;
      default: setViewBooking(b);
    }
  }

  function actionLabel(status: BookingStatus) {
    switch (status) {
      case 'ESCROW_HELD': return 'Awaiting mentor';
      case 'ACCEPTED': return T.join ?? 'Join';
      case 'TAUGHT': return 'Confirm';
      case 'COMPLETED': return T.review ?? 'Review';
      default: return T.view ?? 'View';
    }
  }

  function actionVariant(status: BookingStatus): 'default' | 'outline' | 'destructive' {
    if (status === 'ACCEPTED') return 'default';
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
                          className={b.status === 'ACCEPTED' ? 'gap-1.5' : ''}>
                          {b.status === 'ACCEPTED' && <Video className="size-3.5" />}
                          {actionLabel(b.status)}
                        </Button>
                        {(b.status === 'TAUGHT' || b.status === 'COMPLETED') && (
                          <Button size="sm" variant="outline" className="gap-1 text-primary border-primary/30"
                            onClick={() => setAskBookingItem(b)}>
                            <Sparkles className="size-3.5" /> AI hỏi bài
                          </Button>
                        )}
                        {(b.status === 'ESCROW_HELD' || b.status === 'ACCEPTED' || b.status === 'TAUGHT') && (
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

      {meetBooking && (
        <MeetRoomOverlay
          bookingId={meetBooking.id}
          course={meetBooking.courseCode}
          partnerName={meetBooking.mentorName ?? 'Mentor'}
          durationMinutes={meetBooking.durationMin}
          displayName={user?.name}
          onClose={() => setMeetBooking(null)}
        />
      )}
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
      {reviewBookingItem && (
        <ReviewModal
          booking={reviewBookingItem}
          onClose={() => setReviewBookingItem(null)}
          onReviewed={fetchBookings}
        />
      )}
      {askBookingItem && (
        <AskModal booking={askBookingItem} onClose={() => setAskBookingItem(null)} />
      )}
    </div>
  );
}
