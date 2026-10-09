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
import { useLanguage } from '../../context/LanguageContext';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};
const DAY_VI_SHORT: Record<string, string> = {
  Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN',
};
const DAY_VI: Record<string, string> = {
  Mon: 'Thứ Hai', Tue: 'Thứ Ba', Wed: 'Thứ Tư', Thu: 'Thứ Năm', Fri: 'Thứ Sáu', Sat: 'Thứ Bảy', Sun: 'Chủ Nhật',
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
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [profile, setProfile] = useState<MentorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<Record<string, Set<string>>>(emptySlots());
  const [activeDay, setActiveDay] = useState('Mon');
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

  const selectAllActiveDay = () => {
    setSlots((prev) => ({ ...prev, [activeDay]: new Set(hours) }));
  };

  const clearActiveDay = () => {
    setSlots((prev) => ({ ...prev, [activeDay]: new Set() }));
  };

  const totalSelectedSlots = Object.values(slots).reduce((acc, set) => acc + set.size, 0);

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
      toast.success(vi ? 'Đã cập nhật lịch rảnh thành công.' : 'Availability updated successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Không lưu được lịch rảnh.' : 'Could not save availability.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> {vi ? 'Đang tải lịch rảnh…' : 'Loading availability…'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-1 sm:px-0 pb-16 sm:pb-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Lịch rảnh dạy học (Availability)</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Thiết lập các khung giờ rảnh trong tuần để học viên có thể đặt lịch học với bạn.
          </p>
        </div>
        <div className="hidden sm:block">
          <Button onClick={save} disabled={saving} className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl shadow-lg shadow-cyan-900/30">
            {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Lưu thay đổi ({totalSelectedSlots} ca)
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Weekly schedule Card */}
        <Card className="border-border p-3.5 sm:p-6 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-white text-base">Thời khóa biểu hàng tuần</p>
              <p className="text-xs text-muted-foreground">Chạm vào các khung giờ để bật/tắt lịch rảnh.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              {totalSelectedSlots} ca đã bật
            </span>
          </div>

          {/* MOBILE VIEW: Day Tabs + Vertical Time Slots Grid */}
          <div className="block sm:hidden">
            {/* Day Selector Pills */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {days.map((d) => {
                const isSelected = activeDay === d;
                const count = slots[d].size;
                return (
                  <button
                    key={d}
                    onClick={() => setActiveDay(d)}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all relative border',
                      isSelected
                        ? 'bg-cyan-500 text-white font-bold border-cyan-400 shadow-md shadow-cyan-500/30 scale-105 z-10'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    )}
                  >
                    <span>{DAY_VI_SHORT[d]}</span>
                    <span className="text-[10px] opacity-75 font-normal">{d}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          'mt-1 size-1.5 rounded-full',
                          isSelected ? 'bg-white' : 'bg-cyan-400'
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Day Detail Header & Quick Controls */}
            <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3 mb-3 text-xs">
              <div>
                <span className="font-bold text-white text-sm">{DAY_VI[activeDay]}</span>
                <span className="text-slate-400 ml-1.5">({DAY_FULL[activeDay]})</span>
                <p className="text-[11px] text-cyan-300 font-medium mt-0.5">
                  {slots[activeDay].size > 0 ? `${slots[activeDay].size} ca được chọn` : 'Chưa có ca nào'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectAllActiveDay}
                  className="px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[11px] font-semibold hover:bg-cyan-500/20"
                >
                  Chọn hết
                </button>
                <button
                  type="button"
                  onClick={clearActiveDay}
                  className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 text-[11px] hover:bg-white/10"
                >
                  Xóa
                </button>
              </div>
            </div>

            {/* Mobile Time Grid (3 columns, tap-friendly) */}
            <div className="grid grid-cols-3 gap-2">
              {hours.map((h) => {
                const active = slots[activeDay].has(h);
                return (
                  <button
                    key={`mobile-${activeDay}-${h}`}
                    type="button"
                    onClick={() => toggle(activeDay, h)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all border min-h-[46px] cursor-pointer',
                      active
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400 text-white shadow-md shadow-cyan-500/20 font-bold scale-[1.02]'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                    )}
                  >
                    <span>{active ? '✓' : ''}</span>
                    <span>{h}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESKTOP VIEW: Full 8-column Weekly Timetable Grid */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-8 gap-1.5 text-center text-xs text-muted-foreground">
                <div className="py-1" />
                {days.map((d) => (
                  <div key={d} className="py-1 font-semibold text-white">
                    <div>{DAY_VI_SHORT[d]}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{d}</div>
                  </div>
                ))}
                {hours.map((h) => (
                  <Fragment key={h}>
                    <div className="py-2 pr-2 text-right text-muted-foreground font-mono">{h}</div>
                    {days.map((d) => {
                      const active = slots[d].has(h);
                      return (
                        <button
                          key={d + h}
                          type="button"
                          onClick={() => toggle(d, h)}
                          className={cn(
                            'rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer',
                            active
                              ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30'
                              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
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
          </div>
        </Card>

        {/* Sidebar settings */}
        <div className="space-y-4">
          <Card className="border-border p-4 sm:p-5 bg-slate-900/60 backdrop-blur-xl">
            <p className="mb-4 font-semibold text-white">Cài đặt buổi dạy (Session settings)</p>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-xs sm:text-sm text-slate-300">Thời gian nghỉ giữa các buổi</Label>
                <Select value={bufferTime} onValueChange={setBufferTime}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-950 text-white border-white/10">
                    <SelectItem value="0">Không nghỉ (No buffer)</SelectItem>
                    <SelectItem value="15">15 phút</SelectItem>
                    <SelectItem value="30">30 phút</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs sm:text-sm text-slate-300">Số buổi tối đa mỗi ngày</Label>
                <Select value={maxPerDay} onValueChange={setMaxPerDay}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-950 text-white border-white/10">
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} buổi/ngày ({n} session{n > 1 && 's'})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-xs sm:text-sm text-slate-300">Hình thức giảng dạy</Label>
                <div className="flex flex-col gap-2">
                  {['Online', 'Offline', 'Both'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={cn(
                        'rounded-xl border px-4 py-2.5 text-xs sm:text-sm text-left transition-colors font-medium cursor-pointer',
                        format === f
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-semibold'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      )}
                    >
                      {f === 'Both' ? 'Cả Online & Offline' : f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Button className="w-full hidden sm:flex bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl h-11" size="lg" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Lưu lịch rảnh ({totalSelectedSlots} ca)
          </Button>
        </div>
      </div>

      {/* Sticky Save Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 flex items-center justify-between gap-3 sm:hidden shadow-2xl">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate">{totalSelectedSlots} ca đã chọn</p>
          <p className="text-[11px] text-slate-400 truncate">Nhấn lưu để áp dụng</p>
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl h-10 px-5 shadow-lg shadow-cyan-900/40 text-xs shrink-0"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
          Lưu lịch rảnh
        </Button>
      </div>
    </div>
  );
}
