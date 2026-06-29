import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  CalendarClock, CheckCircle2, Clock, Wallet,
  Video, Mic, MicOff, VideoOff, PhoneOff, MessageSquare,
  Users, MonitorUp, Star, AlertTriangle, X, ShieldCheck,
} from 'lucide-react';
import { sessions, formatCurrency, Session } from '../data/mockData';
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
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { KpiCard } from '../components/cards';
import { StatusBadge, EmptyState } from '../components/common';
import { cn } from '../components/ui/utils';
import { toast } from 'sonner';

// tabs are now derived in the component using T

const issueTypes = [
  'Session not attended',
  'Quality concern',
  'Refund request',
  'Technical issue',
  'Mentor misconduct',
  'Other',
];

// ── Meet room ──────────────────────────────────────────────────
function MeetRoom({ session, onClose }: { session: Session; onClose: () => void }) {
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
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white text-xs" style={{ fontWeight: 700 }}>G</span>
          <div>
            <p className="text-sm text-white" style={{ fontWeight: 600 }}>{session.course}</p>
            <p className="text-xs text-white/50">with {session.mentorName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-danger/20 px-3 py-1 text-xs text-red-400">
            <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
            LIVE · {elapsed}
          </span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex flex-1 gap-3 px-6 pb-4 min-h-0">
        {/* Main (mentor) */}
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-[#1c1f2e]">
          <ImageWithFallback
            src={session.mentorAvatar}
            alt={session.mentorName}
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute bottom-4 left-4 rounded-xl bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur" style={{ fontWeight: 500 }}>
            {session.mentorName} (Mentor)
          </div>
        </div>
        {/* Self */}
        <div className="relative w-48 overflow-hidden rounded-2xl bg-[#1c1f2e] self-end">
          <div className="flex aspect-video items-center justify-center">
            {cam ? (
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/30 text-white text-2xl" style={{ fontWeight: 700 }}>
                T
              </div>
            ) : (
              <VideoOff className="size-8 text-white/30" />
            )}
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-white/60">You</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pb-8">
        <ControlBtn icon={mic ? Mic : MicOff} active={mic} onClick={() => setMic(!mic)} label={mic ? 'Mute' : 'Unmute'} />
        <ControlBtn icon={cam ? Video : VideoOff} active={cam} onClick={() => setCam(!cam)} label={cam ? 'Stop video' : 'Start video'} />
        <ControlBtn icon={MessageSquare} onClick={() => toast.info('Chat panel — coming soon.')} label="Chat" />
        <ControlBtn icon={Users} onClick={() => toast.info('Participants panel.')} label="Participants" />
        <ControlBtn icon={MonitorUp} onClick={() => toast.info('Screen share — coming soon.')} label="Share screen" />
        <button
          onClick={end}
          className="flex flex-col items-center gap-1 rounded-2xl bg-danger px-6 py-3 text-white transition-opacity hover:opacity-90"
        >
          <PhoneOff className="size-5" />
          <span className="text-xs" style={{ fontWeight: 500 }}>End</span>
        </button>
      </div>
    </div>
  );
}

function ControlBtn({
  icon: Icon, active = true, onClick, label,
}: { icon: React.ElementType; active?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-2xl px-5 py-3 transition-colors',
        active ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
      )}
    >
      <Icon className="size-5" />
      <span className="text-xs" style={{ fontWeight: 500 }}>{label}</span>
    </button>
  );
}

// ── Session detail ─────────────────────────────────────────────
function ViewModal({ session, onClose }: { session: Session; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Session details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ImageWithFallback src={session.mentorAvatar} alt={session.mentorName} className="size-12 rounded-xl object-cover" />
            <div>
              <p style={{ fontWeight: 600 }}>{session.mentorName}</p>
              <p className="text-sm text-muted-foreground">{session.course}</p>
            </div>
            <div className="ml-auto"><StatusBadge status={session.status} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Date', new Date(session.dateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
              ['Time', new Date(session.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })],
              ['Duration', `${session.durationMinutes} minutes`],
              ['Format', session.format],
              ['Amount', formatCurrency(session.amount)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground">{label}</p>
                <p style={{ fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>
          {session.status === 'In Escrow' && (
            <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              Payment is securely held in escrow and will be released after session completion.
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

// ── Review modal ───────────────────────────────────────────────
function ReviewModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a star rating.'); return; }
    toast.success('Review submitted. Thank you!');
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Leave a review</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ImageWithFallback src={session.mentorAvatar} alt={session.mentorName} className="size-12 rounded-xl object-cover" />
            <div>
              <p style={{ fontWeight: 600 }}>{session.mentorName}</p>
              <p className="text-sm text-muted-foreground">{session.course}</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="mb-2 block">Your rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'size-8',
                        star <= (hover || rating) ? 'fill-warning text-warning' : 'text-border'
                      )}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block">Write your review</Label>
              <Textarea placeholder="Share your experience with this mentor..." rows={4} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Submit Review</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Dispute modal ──────────────────────────────────────────────
function DisputeModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Dispute submitted. GRADORA will review within 48 hours.');
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Open a dispute</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ImageWithFallback src={session.mentorAvatar} alt={session.mentorName} className="size-12 rounded-xl object-cover" />
            <div>
              <p style={{ fontWeight: 600 }}>{session.mentorName}</p>
              <p className="text-sm text-muted-foreground">{session.course}</p>
            </div>
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
              <Button type="submit" variant="destructive">Submit Dispute</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main dashboard ─────────────────────────────────────────────
export function StudentDashboard() {
  const { T } = useLanguage();
  const [tab, setTab] = useState('All');
  const [meetSession, setMeetSession] = useState<Session | null>(null);
  const [viewSession, setViewSession] = useState<Session | null>(null);
  const [reviewSession, setReviewSession] = useState<Session | null>(null);
  const [disputeSession, setDisputeSession] = useState<Session | null>(null);

  const totalHours = sessions
    .filter((s) => s.status === 'Completed')
    .reduce((sum, s) => sum + s.durationMinutes / 60, 0);
  const totalSpent = sessions
    .filter((s) => s.status !== 'Cancelled')
    .reduce((sum, s) => sum + s.amount, 0);
  const upcoming = sessions.filter((s) => s.status === 'Upcoming').length;
  const completed = sessions.filter((s) => s.status === 'Completed').length;

  const filtered = tab === 'All' ? sessions : sessions.filter((s) => s.status === tab);

  function handleAction(s: Session) {
    switch (s.status) {
      case 'Upcoming': setMeetSession(s); break;
      case 'In Escrow': setViewSession(s); break;
      case 'Completed': setReviewSession(s); break;
      case 'Cancelled': setDisputeSession(s); break;
      default: setViewSession(s);
    }
  }

  function actionLabel(status: string) {
    switch (status) {
      case 'Upcoming':  return T.join;
      case 'In Escrow': return T.view;
      case 'Completed': return T.review;
      case 'Cancelled': return T.dispute;
      default:          return T.view;
    }
  }

  function actionVariant(status: string): 'default' | 'outline' | 'destructive' {
    if (status === 'Upcoming') return 'default';
    if (status === 'Cancelled') return 'destructive';
    return 'outline';
  }

  const tabs = [
    { value: 'All',       label: T.all },
    { value: 'Upcoming',  label: T.upcoming },
    { value: 'In Escrow', label: T.inEscrow },
    { value: 'Completed', label: T.completed },
    { value: 'Cancelled', label: T.cancelled },
  ];

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="mb-1" style={{ fontSize: '1.75rem', fontWeight: 700 }}>{T.mySessionsTitle}</h1>
      <p className="mb-6 text-muted-foreground">{T.mySessionsSubtitle}</p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={T.upcoming} value={String(upcoming)} icon={CalendarClock} />
        <KpiCard label={T.completed} value={String(completed)} icon={CheckCircle2} tone="success" />
        <KpiCard label={T.hoursLearned} value={`${totalHours.toFixed(1)}h`} icon={Clock} tone="warning" />
        <KpiCard label={T.totalSpent} value={formatCurrency(totalSpent)} icon={Wallet} />
      </div>

      <Card className="border-border p-5">
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="flex-wrap">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{T.mentor}</TableHead>
                  <TableHead>{T.course}</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ImageWithFallback src={s.mentorAvatar} alt={s.mentorName} className="size-8 rounded-full object-cover" />
                        <span style={{ fontWeight: 500 }}>{s.mentorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.course}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(s.dateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      {' · '}
                      {new Date(s.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.durationMinutes} min</TableCell>
                    <TableCell className="text-muted-foreground">{s.format}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={actionVariant(s.status)}
                        onClick={() => handleAction(s)}
                        className={s.status === 'Upcoming' ? 'gap-1.5' : ''}
                      >
                        {s.status === 'Upcoming' && <Video className="size-3.5" />}
                        {actionLabel(s.status)}
                      </Button>
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

      {/* Modals */}
      {meetSession && <MeetRoom session={meetSession} onClose={() => setMeetSession(null)} />}
      {viewSession && <ViewModal session={viewSession} onClose={() => setViewSession(null)} />}
      {reviewSession && <ReviewModal session={reviewSession} onClose={() => setReviewSession(null)} />}
      {disputeSession && <DisputeModal session={disputeSession} onClose={() => setDisputeSession(null)} />}
    </div>
  );
}
