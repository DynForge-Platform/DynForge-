import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router';
import {
  CalendarCheck, CheckCircle2, TrendingUp, Star, Clock, BadgeCheck, ArrowRight, Video,
} from 'lucide-react';
import {
  teacherSessions, reviews, mentors, formatCurrency, TeacherSession,
} from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { KpiCard } from '../../components/cards';
import { ReviewCard } from '../../components/cards';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { MeetRoomOverlay } from '../../components/MeetRoomOverlay';
import { toast } from 'sonner';

const declineReasons = [
  'Schedule conflict',
  'Outside my expertise',
  'Unavailable at this time',
  'Student requested wrong course',
  'Other',
];

const mentor = mentors[0];

export function TeacherDashboard() {
  const navigate = useNavigate();
  const { T } = useLanguage();
  const upcoming = teacherSessions.filter((s) => s.sessionStatus === 'Upcoming');
  const completed = teacherSessions.filter((s) => s.sessionStatus === 'Completed').length;
  const totalEarnings = teacherSessions
    .filter((s) => s.sessionStatus === 'Completed')
    .reduce((sum, s) => sum + s.amount * 0.85, 0);
  const pending = teacherSessions.filter((s) => s.sessionStatus === 'Pending');

  const [meetSession, setMeetSession] = useState<TeacherSession | null>(null);
  const [acceptSession, setAcceptSession] = useState<TeacherSession | null>(null);
  const [declineSession, setDeclineSession] = useState<TeacherSession | null>(null);

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Session with ${acceptSession?.studentName} accepted! They will be notified.`);
    setAcceptSession(null);
  };

  const handleDecline = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Session with ${declineSession?.studentName} declined. The student will be notified.`);
    setDeclineSession(null);
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      {/* Welcome */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            {T.welcomeBack2}, {mentor.name.split(' ').pop()} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Here's what's happening with your tutoring activity.</p>
        </div>
        <Button onClick={() => navigate('/mentor/availability')}>{T.updateAvailability}</Button>
      </div>

      {/* Verification badge */}
      {mentor.verified && (
  <Alert className="mb-6 border-emerald-200 bg-emerald-50">
    <BadgeCheck className="h-4 w-4 text-emerald-600" />

    <AlertTitle className="text-emerald-700">
      {T.verifiedMentorBadge}
    </AlertTitle>

    <AlertDescription>
      {T.verifiedMentorDesc}
    </AlertDescription>
  </Alert>
)}

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={T.upcomingSessions} value={String(upcoming.length)} icon={CalendarCheck} />
        <KpiCard label={T.completedSessions} value={String(completed)} icon={CheckCircle2} tone="success" />
        <KpiCard label={T.netEarnings} value={formatCurrency(Math.round(totalEarnings))} icon={TrendingUp} tone="success" />
        <KpiCard label={T.avgRating} value={`${mentor.rating.toFixed(1)} / 5`} icon={Star} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Today's schedule */}
        <Card className="border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{T.todaySchedule}</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/mentor/calendar')}>
              {T.fullCalendar} <ArrowRight className="size-4" />
            </Button>
          </div>
          {upcoming.slice(0, 3).length ? (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <ImageWithFallback src={s.studentAvatar} alt={s.studentName} className="size-10 rounded-full object-cover" />
                    <div>
                      <p style={{ fontWeight: 500 }}>{s.studentName}</p>
                      <p className="text-sm text-muted-foreground">{s.course} · {s.durationMinutes} min</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground" style={{ fontWeight: 500 }}>
                      {new Date(s.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <Button size="sm" className="mt-1 gap-1.5" onClick={() => setMeetSession(s)}>
                      <Video className="size-3.5" /> Join
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{T.noSessionsToday}</p>
          )}
        </Card>

        {/* Pending requests */}
        <Card className="border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{T.pendingRequests}</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/mentor/sessions')}>
              {T.viewAll} <ArrowRight className="size-4" />
            </Button>
          </div>
          {pending.length ? (
            <div className="space-y-3">
              {pending.map((s) => (
                <div key={s.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <ImageWithFallback src={s.studentAvatar} alt={s.studentName} className="size-9 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontWeight: 500 }}>{s.studentName}</p>
                      <p className="text-sm text-muted-foreground truncate">{s.course} · {s.durationMinutes} min · {s.format}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-danger border-danger/30 hover:bg-danger/5" onClick={() => setDeclineSession(s)}>
                      Decline
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => setAcceptSession(s)}>
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4" /> {T.noPendingRequests}
            </div>
          )}
        </Card>
      </div>

      {/* Recent reviews */}
      <div className="mt-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{T.recentReviews}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 3).map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </div>

      {/* ── Meet room overlay ───────────────────────────────── */}
      {meetSession && (
        <MeetRoomOverlay
          course={meetSession.course}
          partnerName={meetSession.studentName}
          partnerAvatar={meetSession.studentAvatar}
          partnerRole="Student"
          durationMinutes={meetSession.durationMinutes}
          onClose={() => setMeetSession(null)}
        />
      )}

      {/* ── Accept modal ─────────────────────────────────────── */}
      {acceptSession && (
        <Dialog open onOpenChange={() => setAcceptSession(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="size-5" /> Accept booking request
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAccept} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                <ImageWithFallback src={acceptSession.studentAvatar} alt={acceptSession.studentName} className="size-12 rounded-xl object-cover" />
                <div>
                  <p style={{ fontWeight: 600 }}>{acceptSession.studentName}</p>
                  <p className="text-sm text-muted-foreground">{acceptSession.course}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(acceptSession.dateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · '}
                    {new Date(acceptSession.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{acceptSession.durationMinutes} min · {acceptSession.format}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                By accepting, you confirm you will be available at the scheduled time. The student will be notified immediately.
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setAcceptSession(null)}>Cancel</Button>
                <Button type="submit" className="bg-success hover:bg-success/90">Confirm acceptance</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Decline modal ─────────────────────────────────────── */}
      {declineSession && (
        <Dialog open onOpenChange={() => setDeclineSession(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Decline booking request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDecline} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-accent/40 p-4">
                <ImageWithFallback src={declineSession.studentAvatar} alt={declineSession.studentName} className="size-12 rounded-xl object-cover" />
                <div>
                  <p style={{ fontWeight: 600 }}>{declineSession.studentName}</p>
                  <p className="text-sm text-muted-foreground">{declineSession.course} · {declineSession.durationMinutes} min</p>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Reason for declining</Label>
                <Select>
                  <SelectTrigger className="bg-input-background"><SelectValue placeholder="Select a reason" /></SelectTrigger>
                  <SelectContent>
                    {declineReasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Message to student <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea placeholder="Let the student know why and suggest alternatives if possible..." rows={3} />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDeclineSession(null)}>Cancel</Button>
                <Button type="submit" variant="destructive">Decline request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
