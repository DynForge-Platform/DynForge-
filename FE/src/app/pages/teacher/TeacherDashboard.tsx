import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router';
import {
  CalendarCheck, CheckCircle2, TrendingUp, Star, Clock, BadgeCheck, ArrowRight, Video,
  Loader2, Check, X, BookOpen, Sparkles, ShieldCheck, ArrowUpRight, Calendar, UserCheck
} from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { Button } from '../../components/ui/button';
import { MeetRoomOverlay } from '../../components/MeetRoomOverlay';
import { useJoinFromLink } from '../../hooks/useJoinFromLink';
import { StatusBadge } from '../../components/common';
import { toast } from 'sonner';
import {
  getMentorEarnings, getMentorSchedule, acceptBooking, declineBooking,
  mapStatusToDisplay,
  type MentorEarningsResponse, type BookingResponse,
} from '../../services/bookingService';
import { getMyMentorProfile } from '../../services/mentorService';
import { cn } from '../../components/ui/utils';

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
  useJoinFromLink(setMeetBooking);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [e, s] = await Promise.all([getMentorEarnings(), getMentorSchedule()]);
      setEarnings(e);
      setSchedule(s);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Không thể tải bảng điều khiển giảng dạy.');
    } finally {
      setLoading(false);
    }
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
        toast.success('Đã chấp nhận lịch học. Học viên đã được thông báo.');
      } else {
        await declineBooking(b.id);
        toast.success('Đã từ chối lịch học. Học phí đã được hoàn trả lại cho học viên.');
      }
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Thao tác không thành công.');
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
        <Loader2 className="size-7 animate-spin text-cyan-400" />
        <p className="text-xs uppercase tracking-wider font-semibold">Đang tải không gian làm việc của Mentor…</p>
      </div>
    );
  }

  const firstName = (user?.fullName ?? '').split(' ').pop() ?? 'Mentor';

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      
      {/* ── Hero Welcome Banner ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-950/80 to-indigo-950/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-cyan-500/10 blur-[90px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Sparkles className="size-3 text-cyan-400" />
                Cổng Giảng Dạy & Kèm Cặp Học Thuật
              </span>
              {verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-400">
                  <BadgeCheck className="size-3.5 text-emerald-400" />
                  Mentor Đã Xác Thực
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Chào mừng trở lại, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{firstName}</span>! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Tổng quan hoạt động kèm học thuật, quản lý lịch rảnh và xử lý yêu cầu đặt lịch của sinh viên.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate('/mentor/availability')}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
            >
              <Clock className="size-4" /> Cập nhật lịch rảnh
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/mentor/sessions')}
              className="rounded-2xl border-slate-700 bg-slate-900/80 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Lịch giảng dạy
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Bento Metrics ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Lịch dạy sắp tới</span>
            <CalendarCheck className="size-4 text-cyan-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white tracking-tight">{earnings?.upcomingSessions ?? 0}</p>
          <p className="mt-1 text-[11px] text-cyan-400/90 font-medium">Buổi học đã xác nhận</p>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Đã hoàn thành</span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-400 tracking-tight">{earnings?.completedSessions ?? 0}</p>
          <p className="mt-1 text-[11px] text-emerald-400/90 font-medium">Buổi học thành công</p>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Thu nhập thực nhận</span>
            <TrendingUp className="size-4 text-emerald-400" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-emerald-400 tracking-tight">{formatCurrency(earnings?.totalEarned ?? 0)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Sau khi khấu trừ phí nền tảng 15%</p>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Đánh giá trung bình</span>
            <Star className="size-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-300 tracking-tight">{rating != null ? `${rating.toFixed(1)} / 5` : '5.0'}</p>
          <p className="mt-1 text-[11px] text-amber-400/90 font-medium">Từ nhận xét của học viên</p>
        </div>
      </div>

      {/* ── Two-column: Schedule & Pending Requests ──────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Today / Upcoming Schedule (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="size-4 text-cyan-400" />
                Lịch giảng dạy sắp tới
              </h2>
              <p className="text-xs text-slate-400">Các buổi học đã được xác nhận và sẵn sàng diễn ra.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-cyan-400 hover:text-cyan-300 text-xs"
              onClick={() => navigate('/mentor/sessions')}
            >
              Xem tất cả <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>

          {upcoming.length ? (
            <div className="space-y-3">
              {upcoming.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-cyan-500/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <BookOpen className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{b.courseCode}</p>
                      <p className="text-xs text-slate-400">
                        {b.format === 'ONE_ON_ONE' ? '1-kèm-1' : 'Học nhóm'} · {b.durationMin} phút · {b.menteeName || 'Học viên'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-300 font-semibold">
                      {new Date(b.startAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} · {new Date(b.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setMeetBooking(b)}
                      className="mt-1.5 h-8 gap-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 text-xs font-bold text-white hover:from-cyan-400 hover:to-blue-500"
                    >
                      <Video className="size-3.5" /> Vào lớp
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Calendar className="size-8 mx-auto text-slate-600" />
              <p className="text-xs">Không có buổi học nào sắp tới.</p>
            </div>
          )}
        </div>

        {/* Pending Requests Waiting for Mentor (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="size-4 text-amber-400" />
                Yêu cầu đặt lịch ({pending.length})
              </h2>
              <p className="text-xs text-slate-400">Học viên đã thanh toán ký quỹ.</p>
            </div>
          </div>

          {pending.length ? (
            <div className="space-y-3">
              {pending.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">{b.courseCode}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(b.startAt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })} · {new Date(b.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs font-semibold text-emerald-400 mt-1">
                        Học phí: {formatCurrency(b.price)}
                      </p>
                    </div>
                    <StatusBadge status={mapStatusToDisplay(b.status)} />
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-slate-800/60">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === b.id}
                      onClick={() => act(b, 'decline')}
                      className="flex-1 rounded-xl border-slate-800 text-red-400 hover:bg-red-950/30 text-xs"
                    >
                      <X className="size-3.5 mr-1" /> Từ chối
                    </Button>
                    <Button
                      size="sm"
                      disabled={actingId === b.id}
                      onClick={() => act(b, 'accept')}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs"
                    >
                      {actingId === b.id ? <Loader2 className="size-3.5 animate-spin" /> : <><Check className="size-3.5 mr-1" /> Chấp nhận</>}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="size-8 mx-auto text-slate-600" />
              <p className="text-xs">Không có yêu cầu đặt lịch nào đang chờ duyệt.</p>
            </div>
          )}
        </div>

      </div>

      {/* Jitsi Meet Overlay */}
      {meetBooking && (
        <MeetRoomOverlay
          bookingId={meetBooking.id}
          roomId={meetBooking.roomId}
          course={meetBooking.courseCode}
          partnerName={meetBooking.menteeName ?? 'Học viên'}
          durationMinutes={meetBooking.durationMin}
          displayName={user?.name}
          onClose={() => setMeetBooking(null)}
        />
      )}
    </div>
  );
}
