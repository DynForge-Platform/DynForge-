import { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import {
  CalendarCheck, CheckCircle2, TrendingUp, Star, Clock, BadgeCheck, ArrowRight, Video,
  Loader2, Check, X, BookOpen,
} from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { KpiCard } from '../../components/cards';
import { MeetRoomOverlay } from '../../components/MeetRoomOverlay';
import { StatusBadge } from '../../components/common';
import { toast } from 'sonner';
import {
  getMentorEarnings, getMentorSchedule, acceptBooking, declineBooking,
  mapStatusToDisplay,
  type MentorEarningsResponse, type BookingResponse,
} from '../../services/bookingService';
import { getMyMentorProfile } from '../../services/mentorService';

const UPCOMING = ['ACCEPTED', 'TAUGHT'];

export function TeacherDashboard() {
  const navigate = useNavigate();
  const { T } = useLanguage();
  const { user } = useAuth();

  const [earnings, setEarnings] = useState<MentorEarningsResponse | null>(null);
  const [schedule, setSchedule] = useState<BookingResponse[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const [meetBooking, setMeetBooking] = useState<BookingResponse | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [e, s] = await Promise.all([getMentorEarnings(), getMentorSchedule()]);
      setEarnings(e);
      setSchedule(s);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
    // Rating/verified come from the mentor profile; ignore if not a mentor yet
    try {
      const profile = await getMyMentorProfile();
      setRating(profile.ratingAvg);
      setVerified(profile.verified);
    } catch { /* no mentor profile */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pending = schedule.filter((b) => b.status === 'ESCROW_HELD');
  const upcoming = schedule.filter((b) => UPCOMING.includes(b.status));

  const act = async (b: BookingResponse, kind: 'accept' | 'decline') => {
    setActingId(b.id);
    try {
      if (kind === 'accept') {
        await acceptBooking(b.id);
        toast.success('Request accepted. The student has been notified.');
      } else {
        await declineBooking(b.id);
        toast.success('Request declined. The student has been refunded.');
      }
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Action failed.');
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Loading dashboard…
      </div>
    );
  }

  const firstName = (user?.fullName ?? '').split(' ').pop() ?? '';

  return (
    <div className="mx-auto max-w-[1100px]">
      {/* Welcome */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            {T.welcomeBack2}, {firstName} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Here's what's happening with your tutoring activity.</p>
        </div>
        <Button onClick={() => navigate('/mentor/availability')}>{T.updateAvailability}</Button>
      </div>

      {/* Verification badge */}
      {verified && (
        <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <BadgeCheck className="h-4 w-4 text-emerald-400" />
          <AlertTitle className="text-emerald-300 font-semibold">{T.verifiedMentorBadge}</AlertTitle>
          <AlertDescription className="text-emerald-300/80">{T.verifiedMentorDesc}</AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={T.upcomingSessions} value={String(earnings?.upcomingSessions ?? 0)} icon={CalendarCheck} />
        <KpiCard label={T.completedSessions} value={String(earnings?.completedSessions ?? 0)} icon={CheckCircle2} tone="success" />
        <KpiCard label={T.netEarnings} value={formatCurrency(earnings?.totalEarned ?? 0)} icon={TrendingUp} tone="success" />
        <KpiCard label={T.avgRating} value={rating != null ? `${rating.toFixed(1)} / 5` : '—'} icon={Star} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Upcoming schedule */}
        <Card className="border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{T.todaySchedule}</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/mentor/sessions')}>
              {T.viewAll} <ArrowRight className="size-4" />
            </Button>
          </div>
          {upcoming.length ? (
            <div className="space-y-3">
              {upcoming.slice(0, 4).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="size-5" />
                    </span>
                    <div>
                      <p style={{ fontWeight: 500 }}>{b.courseCode}</p>
                      <p className="text-sm text-muted-foreground">
                        {b.format.replace('_', '-')} · {b.durationMin} min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground" style={{ fontWeight: 500 }}>
                      {new Date(b.startAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      {' · '}
                      {new Date(b.startAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <Button size="sm" className="mt-1 gap-1.5" onClick={() => setMeetBooking(b)}>
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
              {pending.map((b) => (
                <div key={b.id} className="rounded-xl border border-border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p style={{ fontWeight: 500 }}>{b.courseCode}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {b.format.replace('_', '-')} · {b.durationMin} min · {formatCurrency(b.price)}
                      </p>
                    </div>
                    <StatusBadge status={mapStatusToDisplay(b.status)} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-danger border-danger/30 hover:bg-danger/5"
                      disabled={actingId === b.id}
                      onClick={() => act(b, 'decline')}
                    >
                      <X className="size-3.5" /> Decline
                    </Button>
                    <Button size="sm" className="flex-1" disabled={actingId === b.id} onClick={() => act(b, 'accept')}>
                      {actingId === b.id ? <Loader2 className="size-3.5 animate-spin" /> : <><Check className="size-3.5" /> Accept</>}
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

      {/* Meet room overlay */}
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
    </div>
  );
}
