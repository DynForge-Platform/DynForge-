import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ChevronLeft, ChevronRight, ShieldCheck, Video, MapPin } from 'lucide-react';
import { getMentor, formatCurrency } from '../data/mockData';
import { Button, buttonVariants } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card } from '../components/ui/card';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { cn } from '../components/ui/utils';

const durations = [30, 45, 60, 90];
const customDurations = [120, 180, 240];

export function ScheduleConsultation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { T } = useLanguage();

  const learningModes = [T.oneOnOne, T.group, T.custom];
  const slotGroups = {
    [T.morning]: ['08:00', '09:00', '10:00', '11:00'],
    [T.afternoon]: ['13:00', '14:00', '15:00', '16:00'],
    [T.evening]: ['18:00', '19:00', '20:00'],
  };
  const mentor = getMentor(id);

  // Redirect to login if not authenticated
  if (!user) {
    navigate(`/login?redirect=/mentors/${id}/schedule`);
    return null;
  }

  const [monthOffset, setMonthOffset] = useState(0);
  const [duration, setDuration] = useState(60);
  const [showCustom, setShowCustom] = useState(false);
  const [mode, setMode] = useState('1-on-1');
  const [format, setFormat] = useState<'Online' | 'Offline'>('Online');
  const [selectedDay, setSelectedDay] = useState<number | null>(22);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>(mentor?.courses?.[0] ?? '');

  if (!mentor) return <div className="p-20 text-center">{T.mentorNotFound}</div>;

  const base = new Date(2026, 5 + monthOffset, 1);
  const monthLabel = base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(base.getFullYear(), base.getMonth(), 1).getDay();
  const today = 20;

  // Rate changes based on learning mode
  const activeRate =
    mode === 'Group' ? mentor.groupRate
    : mode === 'Custom' ? Math.round((mentor.hourlyRate + mentor.groupRate) / 2)
    : mentor.hourlyRate;
  const price = Math.round((activeRate * duration) / 60);

  const cont = () => {
    navigate(`/mentors/${mentor.id}/order`, {
      state: { duration, mode, format, day: selectedDay, slot: selectedSlot, price, courseCode: selectedCourse, mentorId: mentor.id },
    });
  };

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10">
      <h1 className="mb-1" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700 }}>
        {T.scheduleTitle}
      </h1>
      <p className="mb-8 text-muted-foreground">{T.scheduleSubtitle}</p>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        {/* Summary sidebar */}
        <aside className="lg:sticky lg:top-[88px] lg:h-fit">
          <Card className="border-border p-6">
            <div className="flex items-center gap-3">
              <ImageWithFallback src={mentor.avatar} alt={mentor.name} className="size-14 rounded-xl object-cover" />
              <div>
                <p style={{ fontWeight: 600 }}>{mentor.name}</p>
                <p className="text-sm text-muted-foreground">{mentor.role}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">{T.learningMode}</p>
                <div className="flex flex-wrap gap-2">
                  {learningModes.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                        mode === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-muted-foreground">{T.format}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['Online', 'Offline'] as const).map((f) => {
                    const label = f === 'Online' ? T.online : T.offline;
                    const Icon = f === 'Online' ? Video : MapPin;
                    return (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                          format === f ? 'border-primary bg-accent text-primary' : 'border-border hover:bg-accent'
                        )}
                      >
                        <Icon className="size-4" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {mentor.courses && mentor.courses.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Course</p>
                  <div className="flex flex-wrap gap-2">
                    {mentor.courses.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCourse(c)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                          selectedCourse === c
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:bg-accent'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <SummaryRow label={T.sessionType} value={mode} />
              <SummaryRow label={T.duration} value={duration >= 120 ? `${duration / 60}h (${duration} min)` : `${duration} min`} />
              <SummaryRow
                label={T.date}
                value={selectedDay ? `${selectedDay} ${base.toLocaleDateString('en-US', { month: 'short' })}` : '—'}
              />
              <SummaryRow label={T.time} value={selectedSlot ?? '—'} />
            </div>

            <div className="mt-4 border-t border-border pt-4">
              {/* Rate reference */}
              <div className="mb-3 rounded-xl bg-accent/60 px-3 py-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className={cn('text-muted-foreground', mode === 'Group' && 'text-primary font-semibold')}>
                    {T.groupRate}
                  </span>
                  <span className={cn('font-semibold', mode === 'Group' ? 'text-primary' : 'text-muted-foreground')}>
                    {formatCurrency(mentor.groupRate)}/hr
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn('text-muted-foreground', mode === '1-on-1' && 'text-primary font-semibold')}>
                    {T.oneOnOneRate}
                  </span>
                  <span className={cn('font-semibold', mode === '1-on-1' ? 'text-primary' : 'text-muted-foreground')}>
                    {formatCurrency(mentor.hourlyRate)}/hr
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground">{T.total}</span>
                  <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary" style={{ fontWeight: 500 }}>
                    {mode} · {duration} {T.minLabel}
                  </span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{formatCurrency(price)}</span>
              </div>
            </div>
          </Card>
        </aside>

        {/* Main */}
        <div className="space-y-6">
          <Card className="border-border p-6">
            <p className="mb-3" style={{ fontWeight: 600 }}>{T.selectDuration}</p>
            <div className="flex flex-wrap gap-3">
              {durations.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDuration(d); setShowCustom(false); }}
                  className={cn(
                    'rounded-xl border px-5 py-3 text-sm transition-colors',
                    duration === d && !showCustom
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-accent'
                  )}
                  style={{ fontWeight: 500 }}
                >
                  {d} {T.minLabel}
                </button>
              ))}
              {/* Custom toggle button */}
              <button
                onClick={() => setShowCustom((v) => !v)}
                className={cn(
                  'rounded-xl border px-5 py-3 text-sm transition-colors',
                  showCustom
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-dashed border-border text-muted-foreground hover:bg-accent'
                )}
                style={{ fontWeight: 500 }}
              >
                {T.custom}
              </button>
            </div>

            {/* Custom duration options — 2h / 3h / 4h */}
            {showCustom && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-accent/50 p-4">
                <p className="mb-3 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>
                  {T.extendedSession}
                </p>
                <div className="flex flex-wrap gap-3">
                  {customDurations.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn(
                        'rounded-xl border px-5 py-3 text-sm transition-colors',
                        duration === d
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-white hover:border-primary hover:text-primary'
                      )}
                      style={{ fontWeight: 500 }}
                    >
                      <span>{d / 60}h</span>
                      <span className={cn('ml-1.5 text-xs', duration === d ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        ({formatCurrency(Math.round((activeRate * d) / 60))})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

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

            <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground">
              {[T.sun, T.mon, T.tue, T.wed, T.thu, T.fri, T.sat].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const past = monthOffset === 0 && day < today;
                const unavailable = past || day % 7 === 0; // mute Sundays + past
                const selected = selectedDay === day && monthOffset === 0;
                return (
                  <button
                    key={day}
                    disabled={unavailable}
                    onClick={() => { setSelectedDay(day); setSelectedSlot(null); }}
                    className={cn(
                      'aspect-square rounded-lg text-sm transition-colors',
                      unavailable && 'cursor-not-allowed text-muted-foreground/40',
                      !unavailable && !selected && 'hover:bg-accent text-foreground',
                      selected && 'bg-primary text-primary-foreground'
                    )}
                    style={{ fontWeight: selected ? 600 : 400 }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="border-border p-6">
            <p className="mb-4" style={{ fontWeight: 600 }}>{T.availableTimeSlots}</p>
            {selectedDay ? (
              <div className="space-y-5">
                {Object.entries(slotGroups).map(([group, slots]) => {
                  const groupLabel = group === 'Morning' ? T.morning : group === 'Afternoon' ? T.afternoon : T.evening;
                  return (
                  <div key={group}>
                    <p className="mb-2 text-sm text-muted-foreground">{groupLabel}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((slot) => {
                        const selected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              'rounded-lg border py-2.5 text-sm transition-colors',
                              selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-primary'
                            )}
                            style={{ fontWeight: 500 }}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">{T.selectDateFirst}</p>
            )}
          </Card>

          <div className="flex items-center justify-between">
            <Link to={`/mentors/${mentor.id}`} className={buttonVariants({ variant: 'ghost' })}>
              {T.backToProfile}
            </Link>
            <Button size="lg" disabled={!selectedDay || !selectedSlot} onClick={cont}>
              {T.continueToOrder}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            {T.escrowNote}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
