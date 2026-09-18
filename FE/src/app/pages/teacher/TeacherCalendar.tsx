import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, ArrowRight, CalendarX, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { cn } from '../../components/ui/utils';
import { formatCurrency } from '../../data/mockData';
import { StatusBadge } from '../../components/common';
import {
  getMentorSchedule, mapStatusToDisplay, type BookingResponse,
} from '../../services/bookingService';
import { getMyMentorProfile } from '../../services/mentorService';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Bookings that count as a real session on the calendar.
const ACTIVE = ['ESCROW_HELD', 'ACCEPTED', 'TAUGHT', 'COMPLETED'];
const UPCOMING = ['ESCROW_HELD', 'ACCEPTED', 'TAUGHT'];

export function TeacherCalendar() {
  const navigate = useNavigate();
  const [monthOffset, setMonthOffset] = useState(0);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [availDays, setAvailDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      getMentorSchedule().catch(() => [] as BookingResponse[]),
      getMyMentorProfile().catch(() => null),
    ]).then(([sched, prof]) => {
      setBookings(sched);
      setAvailDays(new Set(Object.keys(prof?.availability ?? {})));
    }).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthLabel = base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(base.getFullYear(), base.getMonth(), 1).getDay();
  const todayDay = monthOffset === 0 ? now.getDate() : -1;

  // Days (in the shown month) that have a session.
  const bookedDays = useMemo(() => {
    const s = new Set<number>();
    bookings.forEach((b) => {
      const d = new Date(b.startAt);
      if (ACTIVE.includes(b.status) && d.getFullYear() === base.getFullYear() && d.getMonth() === base.getMonth()) {
        s.add(d.getDate());
      }
    });
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, monthOffset]);

  const isAvailableWeekday = (day: number) =>
    availDays.has(WEEKDAYS[new Date(base.getFullYear(), base.getMonth(), day).getDay()]);

  const sessionsOnDay = (day: number) =>
    bookings
      .filter((b) => {
        const d = new Date(b.startAt);
        return ACTIVE.includes(b.status)
          && d.getFullYear() === base.getFullYear() && d.getMonth() === base.getMonth() && d.getDate() === day;
      })
      .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));

  const upcoming = useMemo(
    () => bookings
      .filter((b) => UPCOMING.includes(b.status) && +new Date(b.startAt) >= Date.now() - 3600_000)
      .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt)),
    [bookings],
  );

  function dayStyle(day: number) {
    const past = monthOffset === 0 && day < todayDay;
    if (selectedDay === day) return 'bg-cyan-500 text-white font-bold shadow-lg ring-2 ring-cyan-400/40';
    if (past) return 'text-muted-foreground/40 cursor-default';
    if (bookedDays.has(day)) return 'bg-primary text-primary-foreground';
    if (isAvailableWeekday(day)) return 'bg-success/15 text-success hover:bg-success/30';
    return 'text-muted-foreground hover:bg-accent';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Loading calendar…
      </div>
    );
  }

  const selectedSessions = selectedDay != null ? sessionsOnDay(selectedDay) : [];

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Calendar</h1>
        <p className="mt-1 text-muted-foreground">Your booked sessions and available days at a glance.</p>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        {[
          { color: 'bg-primary', label: 'Booked session' },
          { color: 'bg-success/30', label: 'Available' },
          { color: 'bg-accent', label: 'Unavailable / past' },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-2">
            <span className={`size-3 rounded-full ${l.color}`} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <p style={{ fontWeight: 600 }}>{monthLabel}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => { setMonthOffset((v) => Math.max(0, v - 1)); setSelectedDay(null); }} disabled={monthOffset === 0}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => { setMonthOffset((v) => v + 1); setSelectedDay(null); }}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const past = monthOffset === 0 && day < todayDay;
              return (
                <button
                  key={day}
                  disabled={past}
                  onClick={() => setSelectedDay(day)}
                  className={cn('flex aspect-square items-center justify-center rounded-lg text-sm transition-colors', dayStyle(day))}
                  style={{ fontWeight: bookedDays.has(day) ? 700 : 400 }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Selected day sessions */}
          {selectedDay != null && (
            <Card className="border-border p-6">
              <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {new Date(base.getFullYear(), base.getMonth(), selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}
              </h2>
              {selectedSessions.length ? (
                <div className="space-y-3">
                  {selectedSessions.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => navigate('/mentor/sessions')}
                      className="w-full rounded-xl border-l-4 border-primary bg-accent/50 p-4 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center justify-between">
                        <p style={{ fontWeight: 600 }}>{b.menteeName ?? 'Student'}</p>
                        <StatusBadge status={mapStatusToDisplay(b.status)} />
                      </div>
                      <p className="text-sm text-muted-foreground">{b.courseCode} · {formatCurrency(b.price)}</p>
                      <p className="mt-1 text-sm text-primary" style={{ fontWeight: 500 }}>
                        {new Date(b.startAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {b.durationMin} min
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
                  <CalendarX className="size-7" />
                  <p className="text-sm">Không có lịch dạy trong ngày này.</p>
                </div>
              )}
            </Card>
          )}

          {/* Upcoming sessions → leads to sessions page */}
          <Card className="border-border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Upcoming sessions</h2>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/mentor/sessions')}>
                View all <ArrowRight className="size-4" />
              </Button>
            </div>
            {upcoming.length ? (
              <div className="space-y-3">
                {upcoming.slice(0, 5).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => navigate('/mentor/sessions')}
                    className="w-full rounded-xl border-l-4 border-primary bg-accent/50 p-4 text-left transition-colors hover:bg-accent"
                  >
                    <p style={{ fontWeight: 600 }}>{b.menteeName ?? 'Student'}</p>
                    <p className="text-sm text-muted-foreground">{b.courseCode}</p>
                    <p className="mt-1 text-sm text-primary" style={{ fontWeight: 500 }}>
                      {new Date(b.startAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      {' · '}
                      {new Date(b.startAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{b.durationMin} min
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming sessions.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
