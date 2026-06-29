import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { teacherSessions } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { cn } from '../../components/ui/utils';

export function TeacherCalendar() {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = 20; // June 20, 2026

  const base = new Date(2026, 5 + monthOffset, 1);
  const monthLabel = base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(base.getFullYear(), base.getMonth(), 1).getDay();

  const bookedDays = new Set(
    teacherSessions
      .filter((s) => s.sessionStatus === 'Upcoming' || s.sessionStatus === 'Completed')
      .map((s) => new Date(s.dateTime).getDate())
  );
  const availableDays = new Set([21, 23, 24, 25, 26, 27]);

  function dayStyle(day: number) {
    const past = monthOffset === 0 && day < today;
    if (past) return 'text-muted-foreground/40 cursor-default';
    if (bookedDays.has(day)) return 'bg-primary text-primary-foreground';
    if (availableDays.has(day)) return 'bg-success/15 text-success hover:bg-success/30';
    return 'text-muted-foreground hover:bg-accent';
  }

  const upcomingList = teacherSessions.filter((s) => s.sessionStatus === 'Upcoming');

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Calendar</h1>
          <p className="mt-1 text-muted-foreground">View bookings and manage your availability.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Block time</Button>
          <Button><Plus className="size-4" /> Add Availability</Button>
        </div>
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
              <Button variant="outline" size="icon" onClick={() => setMonthOffset((v) => Math.max(0, v - 1))} disabled={monthOffset === 0}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setMonthOffset((v) => v + 1)}>
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
              return (
                <div
                  key={day}
                  className={cn('flex aspect-square items-center justify-center rounded-lg text-sm transition-colors', dayStyle(day))}
                  style={{ fontWeight: bookedDays.has(day) ? 700 : 400 }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming list */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Upcoming sessions</h2>
          {upcomingList.length ? (
            <div className="space-y-3">
              {upcomingList.map((s) => (
                <div key={s.id} className="rounded-xl border-l-4 border-primary bg-accent/50 p-4">
                  <p style={{ fontWeight: 600 }}>{s.studentName}</p>
                  <p className="text-sm text-muted-foreground">{s.course}</p>
                  <p className="mt-1 text-sm text-primary" style={{ fontWeight: 500 }}>
                    {new Date(s.dateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    {' · '}
                    {new Date(s.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{s.durationMinutes} min
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No upcoming sessions.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
