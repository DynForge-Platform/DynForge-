import { useState, useEffect, Fragment } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { cn } from '../../components/ui/utils';
import { toast } from 'sonner';
import {
  getMyMentorProfile, updateMyMentorProfile, type MentorProfileResponse,
} from '../../services/mentorService';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};
const hours = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`); // 08:00–20:00

const emptySlots = (): Record<string, Set<string>> =>
  Object.fromEntries(days.map((d) => [d, new Set<string>()]));

function formatsToLabel(formats?: string[]): string {
  const has = (f: string) => (formats ?? []).includes(f);
  if (has('Online') && has('Offline')) return 'Both';
  if (has('Offline')) return 'Offline';
  return 'Online';
}

function labelToFormats(label: string): string[] {
  if (label === 'Both') return ['Online', 'Offline'];
  return [label];
}

export function TeacherAvailability() {
  const [profile, setProfile] = useState<MentorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<Record<string, Set<string>>>(emptySlots());
  const [bufferTime, setBufferTime] = useState('15');
  const [maxPerDay, setMaxPerDay] = useState('4');
  const [format, setFormat] = useState('Both');

  useEffect(() => {
    getMyMentorProfile()
      .then((p) => {
        setProfile(p);
        const next = emptySlots();
        Object.entries(p.availability ?? {}).forEach(([full, times]) => {
          const short = days.find((d) => DAY_FULL[d] === full);
          if (short) next[short] = new Set(times);
        });
        setSlots(next);
        setFormat(formatsToLabel(p.formats));
      })
      .catch(() => { /* no profile yet — start empty */ })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (day: string, hour: string) => {
    setSlots((prev) => {
      const next = new Set(prev[day]);
      if (next.has(hour)) next.delete(hour); else next.add(hour);
      return { ...prev, [day]: next };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const availability: Record<string, string[]> = {};
      days.forEach((d) => {
        if (slots[d].size > 0) availability[DAY_FULL[d]] = hours.filter((h) => slots[d].has(h));
      });
      // Preserve the rest of the profile — PUT replaces the whole document.
      await updateMyMentorProfile({
        title: profile?.title,
        bio: profile?.bio,
        major: profile?.major,
        university: profile?.university,
        teachingRole: profile?.teachingRole,
        courses: profile?.courses ?? [],
        skills: profile?.skills ?? [],
        languages: profile?.languages ?? [],
        formats: labelToFormats(format),
        availability,
      });
      toast.success('Availability updated successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not save availability.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Loading availability…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Availability</h1>
        <p className="mt-1 text-muted-foreground">
          Set your weekly teaching schedule. Students see these times when booking.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="overflow-x-auto border-border p-6">
          <p className="mb-1" style={{ fontWeight: 600 }}>Weekly schedule</p>
          <p className="mb-4 text-sm text-muted-foreground">Click slots to toggle availability.</p>
          <div className="min-w-[640px]">
            <div className="grid grid-cols-8 gap-1 text-center text-xs text-muted-foreground">
              <div className="py-1" />
              {days.map((d) => (
                <div key={d} className="py-1" style={{ fontWeight: 600 }}>{d}</div>
              ))}
              {hours.map((h) => (
                <Fragment key={h}>
                  <div className="py-1.5 pr-2 text-right text-muted-foreground">{h}</div>
                  {days.map((d) => {
                    const active = slots[d].has(h);
                    return (
                      <button
                        key={d + h}
                        onClick={() => toggle(d, h)}
                        className={cn(
                          'rounded-md py-1.5 text-xs transition-colors',
                          active ? 'bg-primary text-primary-foreground' : 'bg-accent hover:bg-primary/20'
                        )}
                      >
                        {active ? '✓' : ''}
                      </button>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-border p-5">
            <p className="mb-4" style={{ fontWeight: 600 }}>Session settings</p>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Buffer time between sessions</Label>
                <Select value={bufferTime} onValueChange={setBufferTime}>
                  <SelectTrigger className="bg-input-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Max sessions per day</Label>
                <Select value={maxPerDay} onValueChange={setMaxPerDay}>
                  <SelectTrigger className="bg-input-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} session{n > 1 && 's'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Session format</Label>
                <div className="flex flex-col gap-2">
                  {['Online', 'Offline', 'Both'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={cn(
                        'rounded-lg border px-4 py-2.5 text-sm text-left transition-colors',
                        format === f ? 'border-primary bg-accent text-primary' : 'border-border hover:bg-accent'
                      )}
                      style={{ fontWeight: 500 }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Button className="w-full" size="lg" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : 'Save Availability'}
          </Button>
        </div>
      </div>
    </div>
  );
}
