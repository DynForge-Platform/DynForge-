import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router';
import {
  CalendarClock, CheckCircle2, Clock, Wallet,
  Video, Star, AlertTriangle, ShieldCheck,
  Loader2, Sparkles, Search, LayoutGrid, List,
  GraduationCap, ArrowUpRight, ChevronRight, User,
  Calendar, CreditCard, MessageSquare, ExternalLink,
  Flame, Check, HelpCircle
} from 'lucide-react';
import { formatCurrency } from '../data/mockData';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
import { StatusBadge, EmptyState } from '../components/common';
import { cn } from '../components/ui/utils';
import { toast } from 'sonner';
import {
  getMyBookings, confirmBooking, disputeBooking, rescheduleBooking, cancelBooking,
  mapStatusToDisplay, type BookingResponse, type BookingStatus,
} from '../services/bookingService';
import { createReview } from '../services/reviewService';
import { askSession } from '../services/aiService';
import { getMe, type UserProfile } from '../services/userService';
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
      toast.success('Đã xác nhận buổi học! Học phí đã được giải phóng cho mentor.');
      onConfirmed();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Không thể xác nhận buổi học.');
    } finally {
      setLoading(false);
    }
  };

  const payout = Math.round(booking.price * 0.85);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-950 border border-slate-800 text-slate-100 backdrop-blur-2xl shadow-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <ShieldCheck className="size-5 text-emerald-400" />
            Xác nhận hoàn thành buổi học
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">Môn học</span>
              <span className="text-xs font-semibold text-slate-400"># {booking.id}</span>
            </div>
            <p className="text-base font-bold text-white">{booking.courseCode}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="size-3.5 text-slate-400" />
              <span>{new Date(booking.startAt).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              <span>·</span>
              <Clock className="size-3.5 text-slate-400" />
              <span>{booking.durationMin} phút</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-xs text-emerald-300 leading-relaxed">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-200">Giải phóng học phí Escrow an toàn</p>
              <p className="mt-0.5 text-emerald-300/90">
                Khi xác nhận, khoản tiền <strong className="text-white">{formatCurrency(payout)}</strong> (sau khi trừ 15% phí hệ thống) sẽ được giải phóng ngay lập tức vào ví của Mentor. Thao tác này không thể hoàn tác.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-800 hover:bg-slate-900 text-slate-300">
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-900/40">
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Xác nhận & Giải phóng'}
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
    if (!reason.trim()) { toast.error('Vui lòng mô tả chi tiết vấn đề.'); return; }
    setLoading(true);
    try {
      await disputeBooking(booking.id, issueType, reason.trim());
      toast.success('Đã gửi khiếu nại. Ban quản trị DynForge sẽ xử lý trong vòng 48 giờ.');
      onDisputed();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Gửi khiếu nại thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-950 border border-slate-800 text-slate-100 backdrop-blur-2xl shadow-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-red-400">
            <AlertTriangle className="size-5" />
            Mở khiếu nại buổi học
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
            <p className="font-bold text-white">{booking.courseCode}</p>
            <p className="text-xs text-slate-400">
              {new Date(booking.startAt).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs font-semibold text-slate-300">Loại khiếu nại</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectValue placeholder="Chọn vấn đề gặp phải" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  {issueTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-semibold text-slate-300">Mô tả chi tiết vấn đề</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vui lòng nêu rõ lý do (Mentor không có mặt, chất lượng không như cam kết, sự cố kỹ thuật...)"
                rows={4}
                className="bg-slate-900 border-slate-800 text-slate-200"
                required
              />
            </div>
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3.5 text-xs text-amber-300 leading-relaxed">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-400" />
              DynForge bảo đảm hoàn tiền 100% nếu mentor vi phạm cam kết hoặc vắng mặt không lý do.
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="border-slate-800 hover:bg-slate-900 text-slate-300">Hủy</Button>
              <Button type="submit" variant="destructive" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Gửi khiếu nại'}
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
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) { toast.error('Vui lòng chọn số sao đánh giá.'); return; }
    setLoading(true);
    try {
      await createReview(booking.id, rating, comment.trim() || undefined);
      toast.success('Cảm ơn bạn! Đánh giá đã được ghi nhận.');
      onReviewed();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Gửi đánh giá thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-950 border border-slate-800 text-slate-100 backdrop-blur-2xl shadow-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-amber-400">
            <Star className="size-5 fill-amber-400" />
            Đánh giá chất lượng buổi học
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
            <p className="font-bold text-white">{booking.courseCode}</p>
            <p className="text-xs text-slate-400">
              {new Date(booking.startAt).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} · {booking.durationMin} phút
            </p>
          </div>

          <div className="flex flex-col items-center gap-2.5 py-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${n} star`}
                >
                  <Star
                    className={cn(
                      'size-8 transition-colors',
                      (hover || rating) >= n ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-600'
                    )}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-amber-300">
              {rating ? `${rating} / 5 Sao — ${rating === 5 ? 'Tuyệt vời!' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Bình thường' : 'Cần cải thiện'}` : 'Chạm để đánh giá'}
            </span>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-slate-300">Nhận xét chi tiết <span className="text-slate-400">(Tùy chọn)</span></Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm học tập, sự tận tâm của mentor…"
              rows={3}
              className="bg-slate-900 border-slate-800 text-slate-200"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-800 hover:bg-slate-900 text-slate-300">Hủy</Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Gửi đánh giá'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Reschedule modal ──────────────────────────────────────────
function RescheduleModal({ booking, onClose, onRescheduled }: { booking: BookingResponse; onClose: () => void; onRescheduled: () => void }) {
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [newTime, setNewTime] = useState('14:00');

  const rescheduleCount = booking.rescheduleCount ?? 0;
  const hoursUntilOld = Math.max(0, (new Date(booking.startAt).getTime() - Date.now()) / (1000 * 3600));
  const isOldUnder12h = hoursUntilOld < 12;
  const isExceededLimit = rescheduleCount >= 2;
  const hasPending = !!booking.pendingStartAt;
  const cannotReschedule = isOldUnder12h || isExceededLimit || hasPending;

  const combinedDate = newDate && newTime ? new Date(`${newDate}T${newTime}:00`) : null;
  const hoursUntilNew = combinedDate ? (combinedDate.getTime() - Date.now()) / (1000 * 3600) : null;
  const isFreeReschedule = hoursUntilOld >= 24 && hoursUntilNew != null && hoursUntilNew >= 24;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cannotReschedule) {
      toast.error('Không thể thực hiện đổi lịch cho buổi học này.');
      return;
    }
    if (!newDate || !newTime) {
      toast.error('Vui lòng chọn ngày và giờ mới.');
      return;
    }
    const combined = new Date(`${newDate}T${newTime}:00`);
    const hUntilNew = (combined.getTime() - Date.now()) / (1000 * 3600);
    if (hUntilNew < 2) {
      toast.error('Thời gian mới phải cách hiện tại ít nhất 2 tiếng.');
      return;
    }
    if (hUntilNew > 30 * 24) {
      toast.error('Thời gian mới không được vượt quá 30 ngày kể từ hiện tại.');
      return;
    }
    const isFree = hoursUntilOld >= 24 && hUntilNew >= 24;

    setLoading(true);
    try {
      await rescheduleBooking(booking.id, combined.toISOString());
      if (isFree) {
        toast.success('Đổi lịch học thành công! Mentor đã được cập nhật lịch mới.');
      } else {
        toast.success('Đã gửi yêu cầu đổi lịch tới Mentor! Vui lòng chờ Mentor phản hồi chấp thuận.');
      }
      onRescheduled();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Đổi lịch thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-950 border border-slate-800 text-slate-100 backdrop-blur-2xl shadow-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-cyan-400">
            <CalendarClock className="size-5" />
            Đổi lịch buổi học
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">Môn học</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Đã đổi: {rescheduleCount}/2 lần
              </span>
            </div>
            <p className="text-base font-bold text-white">{booking.courseCode}</p>
            <div className="text-xs text-slate-400 space-y-1">
              <p>Lịch hiện tại: <strong className="text-slate-200">{new Date(booking.startAt).toLocaleString('vi-VN')}</strong></p>
              <p>Thời lượng: <strong className="text-slate-200">{booking.durationMin} phút</strong></p>
            </div>
          </div>

          {hasPending && (
            <div className="rounded-xl bg-amber-950/30 border border-amber-500/30 p-3 text-xs text-amber-300">
              ⏳ Buổi học đang có một yêu cầu đổi lịch chờ Mentor phản hồi sang: <strong>{new Date(booking.pendingStartAt!).toLocaleString('vi-VN')}</strong>.
            </div>
          )}

          {isExceededLimit && (
            <div className="rounded-xl bg-red-950/30 border border-red-500/30 p-3 text-xs text-red-300">
              🚫 Bạn đã sử dụng hết giới hạn đổi lịch (tối đa 2 lần cho mỗi booking).
            </div>
          )}

          {isUnder12h && (
            <div className="rounded-xl bg-red-950/30 border border-red-500/30 p-3 text-xs text-red-300">
              ⚠️ Buổi học diễn ra trong vòng dưới 12 giờ. Hệ thống không cho phép đổi lịch để đảm bảo kế hoạch của Mentor.
            </div>
          )}

          {!cannotReschedule && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-slate-300">Ngày mới</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-slate-300">Giờ mới (GMT+7)</Label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200"
                    required
                  />
                </div>
              </div>

              {!isFreeReschedule ? (
                <div className="rounded-xl bg-amber-950/30 border border-amber-500/20 p-3 text-xs text-amber-300 leading-relaxed">
                  ⚠️ <strong>Cần Mentor phê duyệt:</strong> Do lịch mới hoặc lịch cũ cách dưới 24h, yêu cầu dời lịch này cần sự đồng ý từ Mentor trước khi áp dụng.
                </div>
              ) : (
                <div className="rounded-xl bg-cyan-950/30 border border-cyan-500/20 p-3 text-xs text-cyan-300 leading-relaxed">
                  ℹ️ <strong>Tự do đổi lịch (Cả 2 mốc ≥ 24h):</strong> Cả lịch cũ và mới đều cách ≥ 24h (tối đa 2 lần/booking). Hệ thống tự động cập nhật ngay lập tức.
                </div>
              )}
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-800 hover:bg-slate-900 text-slate-300">
              Đóng
            </Button>
            <Button type="submit" disabled={loading || cannotReschedule} className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : isFreeReschedule ? 'Xác nhận đổi lịch' : 'Gửi yêu cầu tới Mentor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Cancel booking modal ──────────────────────────────────────────
function CancelBookingModal({ booking, onClose, onCancelled }: { booking: BookingResponse; onClose: () => void; onCancelled: () => void }) {
  const [loading, setLoading] = useState(false);
  const hoursUntil = Math.max(0, (new Date(booking.startAt).getTime() - Date.now()) / (1000 * 3600));
  const isPending = booking.status === 'PENDING_PAYMENT';
  const isEscrowHeld = booking.status === 'ESCROW_HELD';
  const isAccepted = booking.status === 'ACCEPTED';

  // If Mentor hasn't accepted yet (ESCROW_HELD) or unpaid (PENDING_PAYMENT) -> 100% refund without penalty
  // If Mentor has accepted (ACCEPTED) -> 24h / 12h-24h / <12h rules apply
  const refund100 = isPending || isEscrowHeld || (isAccepted && hoursUntil >= 24);
  const refund70 = isAccepted && hoursUntil >= 12 && hoursUntil < 24;
  const cannotCancel = isAccepted && hoursUntil < 12;

  const submit = async () => {
    setLoading(true);
    try {
      await cancelBooking(booking.id);
      toast.success(
        refund100
          ? 'Hủy lịch thành công! Đã hoàn 100% học phí về ví.'
          : refund70
          ? 'Hủy lịch thành công! Đã hoàn 70% học phí về ví (30% bồi thường mentor trừ 15% hoa hồng sàn).'
          : 'Hủy lịch thành công.'
      );
      onCancelled();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Hủy lịch thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-950 border border-slate-800 text-slate-100 backdrop-blur-2xl shadow-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-red-400">
            <AlertTriangle className="size-5" />
            Hủy buổi học
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
            <p className="font-bold text-white">{booking.courseCode}</p>
            <p className="text-xs text-slate-400">
              Thời gian: {new Date(booking.startAt).toLocaleString('vi-VN')}
            </p>
            <p className="text-xs text-emerald-400 font-semibold">
              Học phí: {formatCurrency(booking.price)}
            </p>
          </div>

          <div className="space-y-2 text-xs">
            {isEscrowHeld && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-emerald-300">
                ✅ <strong>Mentor chưa nhận lớp:</strong> Do Mentor chưa xác nhận buổi học, bạn được quyền hủy tự do và nhận <strong>hoàn tiền 100% ({formatCurrency(booking.price)})</strong> về ví ngay lập tức.
              </div>
            )}

            {isAccepted && (
              <>
                <p className="font-semibold text-slate-200">Chính sách hủy khi Mentor đã nhận lớp:</p>
                <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-slate-300">
                  <div className={cn('flex items-center justify-between', refund100 && 'text-emerald-400 font-bold')}>
                    <span>• Hủy trước ≥ 24 giờ:</span>
                    <span>Hoàn 100% ({formatCurrency(booking.price)})</span>
                  </div>
                  <div className={cn('flex items-center justify-between', refund70 && 'text-amber-400 font-bold')}>
                    <span>• Hủy trong 12h - 24 giờ:</span>
                    <span>Hoàn 70% ({formatCurrency(Math.floor(booking.price * 0.7))})</span>
                  </div>
                  <div className={cn('flex items-center justify-between', cannotCancel && 'text-red-400 font-bold')}>
                    <span>• Hủy dưới 12 giờ:</span>
                    <span>Từ chối hủy trực tiếp</span>
                  </div>
                </div>

                {refund70 && (
                  <p className="text-[11px] text-amber-400/90 italic">
                    * Phần 30% giữ lại được bồi thường cho Mentor (áp dụng phí hoa hồng sàn 15%).
                  </p>
                )}

                {cannotCancel && (
                  <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3 text-red-400">
                    ⚠️ Buổi học diễn ra trong vòng dưới 12 giờ. Để bảo vệ quyền lợi của Mentor, bạn không thể hủy trực tiếp.
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-800 hover:bg-slate-900 text-slate-300">
              Quay lại
            </Button>
            <Button
              type="button"
              disabled={loading || cannotCancel}
              onClick={submit}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── AI ask modal ───────────────────────────────────────────────
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
      toast.error(err?.response?.data?.message ?? 'Không thể hỏi AI lúc này.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-950 border border-slate-800 text-slate-100 backdrop-blur-2xl shadow-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-cyan-400">
            <Sparkles className="size-5 text-cyan-400 animate-pulse" />
            AI Trợ Giảng Ôn Bài — {booking.courseCode}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-cyan-300 mb-1">🤖 Chào bạn! Tôi là Trợ Lý Học Thuật AI của DynForge.</p>
              Bạn có thể hỏi lại bất kỳ kiến thức nào liên quan đến môn học này. Nếu có video ghi hình, tôi sẽ tổng hợp trọng tâm buổi học cho bạn.
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'rounded-2xl p-3.5 text-xs leading-relaxed max-w-[88%]',
                m.role === 'user'
                  ? 'ml-auto bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'mr-auto bg-slate-900 border border-slate-800 text-slate-200'
              )}
            >
              {m.role === 'user' ? (
                <p className="whitespace-pre-wrap">{m.text}</p>
              ) : (
                <FormattedText content={m.text} />
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-950/20 p-3 rounded-2xl w-fit">
              <Loader2 className="size-4 animate-spin" /> AI đang phân tích bài học và trả lời…
            </div>
          )}

          {suggestions.length > 0 && !loading && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Gợi ý câu hỏi tiếp:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sg, idx) => (
                  <button
                    key={idx}
                    onClick={() => send(sg)}
                    className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/20 transition-all text-left"
                  >
                    💬 {sg}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 pt-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Đặt câu hỏi về buổi học… (Nhấn Enter để gửi)"
            rows={2}
            className="bg-slate-900 border-slate-800 text-slate-200 text-xs resize-none"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="shrink-0 self-end bg-cyan-600 hover:bg-cyan-500 text-white">
            Gửi
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── View modal ─────────────────────────────────────────────────
function ViewModal({ booking, onClose }: { booking: BookingResponse; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-950 border border-slate-800 text-slate-100 backdrop-blur-2xl shadow-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Chi tiết lịch học</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <p className="text-lg font-bold text-white">{booking.courseCode}</p>
              <p className="text-xs text-slate-400">Hình thức: {booking.format === 'ONE_ON_ONE' ? '1-kèm-1' : 'Học nhóm'}</p>
            </div>
            <StatusBadge status={mapStatusToDisplay(booking.status)} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ['Ngày học', new Date(booking.startAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })],
              ['Giờ học (GMT+7)', new Date(booking.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })],
              ['Thời lượng', `${booking.durationMin} phút`],
              ['Học phí', formatCurrency(booking.price)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-slate-400">{label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {booking.status === 'ESCROW_HELD' && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3.5 text-xs text-amber-300">
              <Clock className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold text-amber-200">Đã thanh toán vào Quỹ Ký Quỹ Escrow</p>
                <p className="mt-0.5 text-amber-300/80">Lịch học đang chờ Mentor xác nhận nhận lớp. Bạn sẽ có thể vào phòng học ngay khi Mentor bấm chấp nhận.</p>
              </div>
            </div>
          )}

          {booking.status === 'ACCEPTED' && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-xs text-emerald-300">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-200">Mentor đã sẵn sàng</p>
                <p className="mt-0.5 text-emerald-300/80">Buổi học đã được xác nhận. Vui lòng vào phòng học trực tuyến trước giờ bắt đầu 5 phút.</p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full border-slate-800 hover:bg-slate-900 text-slate-300">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Student Dashboard ─────────────────────────────────────
export function StudentDashboard() {
  const { T } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [tab, setTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [meetBooking, setMeetBooking] = useState<BookingResponse | null>(null);
  const [viewBooking, setViewBooking] = useState<BookingResponse | null>(null);
  const [confirmBookingItem, setConfirmBookingItem] = useState<BookingResponse | null>(null);
  const [disputeBookingItem, setDisputeBookingItem] = useState<BookingResponse | null>(null);
  const [reviewBookingItem, setReviewBookingItem] = useState<BookingResponse | null>(null);
  const [askBookingItem, setAskBookingItem] = useState<BookingResponse | null>(null);
  const [rescheduleBookingItem, setRescheduleBookingItem] = useState<BookingResponse | null>(null);
  const [cancelBookingItem, setCancelBookingItem] = useState<BookingResponse | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch (err: any) {
      console.error('fetchBookings error:', err);
      toast.error(err?.response?.data?.message ?? 'Không thể tải danh sách buổi học.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
    getMe().then(setProfile).catch(() => {});
  }, [fetchBookings]);

  // Next upcoming session spotlight
  const nextSession = useMemo(() => {
    const upcomingList = bookings
      .filter((b) => b.status === 'ACCEPTED' || b.status === 'ESCROW_HELD' || b.status === 'TAUGHT')
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    return upcomingList[0] ?? null;
  }, [bookings]);

  // Dynamic greeting by current hour
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);

  // Filtered bookings
  const displayedBookings = useMemo(() => {
    return bookings.map((b) => ({
      ...b,
      displayStatus: mapStatusToDisplay(b.status),
      tabStatus: b.status === 'ACCEPTED' ? 'In Escrow' : mapStatusToDisplay(b.status),
    }));
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = tab === 'All' ? displayedBookings : displayedBookings.filter((b) => b.tabStatus === tab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) =>
        (b.courseCode && b.courseCode.toLowerCase().includes(q)) ||
        (b.mentorName && b.mentorName.toLowerCase().includes(q)) ||
        (b.id && b.id.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tab, displayedBookings, searchQuery]);

  // Statistics
  const upcomingCount = bookings.filter((b) => b.status === 'ESCROW_HELD' || b.status === 'ACCEPTED').length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const taughtCount = bookings.filter((b) => b.status === 'TAUGHT').length;
  const totalHours = bookings.filter((b) => b.status === 'COMPLETED').reduce((sum, b) => sum + b.durationMin / 60, 0);
  const totalSpent = bookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'PENDING_PAYMENT').reduce((sum, b) => sum + b.price, 0);

  const tabs = [
    { value: 'All', label: 'Tất cả', count: bookings.length },
    { value: 'In Escrow', label: 'Đang Ký Quỹ', count: upcomingCount },
    { value: 'Taught', label: 'Chờ Xác Nhận', count: taughtCount },
    { value: 'Completed', label: 'Hoàn Thành', count: completedCount },
    { value: 'Pending Payment', label: 'Chờ Thanh Toán', count: bookings.filter((b) => b.status === 'PENDING_PAYMENT').length },
    { value: 'Disputed', label: 'Khiếu Nại', count: bookings.filter((b) => b.status === 'DISPUTED').length },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      
      {/* ── 1. Cyber-Academic Welcome Hero Banner ───────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-950/80 to-indigo-950/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-cyan-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 size-64 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Sparkles className="size-3 text-cyan-400" />
                Học viên DynForge
              </span>
              {profile?.universityName && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
                  <GraduationCap className="size-3.5 text-cyan-400" />
                  {profile.universityName}
                </span>
              )}
              {profile?.major && (
                <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-400">
                  {profile.major}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {greetingText}, <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">{profile?.fullName || user?.name || 'Bạn'}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Không gian theo dõi lịch học cá nhân và tương tác với Mentor. Mọi khoản học phí của bạn đều được bảo đảm tuyệt đối qua Quỹ Ký Quỹ Escrow.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/mentors"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] transition-all"
            >
              <Search className="size-4" />
              Đặt lịch Mentor mới
            </Link>
            <Link
              to="/dashboard/wallet"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
            >
              <Wallet className="size-4 text-emerald-400" />
              Ví: {formatCurrency(profile?.walletBalance ?? 0)}
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Spotlight: Next Upcoming Session ──────────────────────────── */}
      {nextSession && (
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-blue-950/30 p-5 sm:p-6 backdrop-blur-2xl shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-300">
                  {nextSession.status === 'ACCEPTED' ? 'Buổi học sắp tới — Sẵn sàng vào lớp' : nextSession.status === 'TAUGHT' ? 'Buổi học vừa hoàn thành — Cần xác nhận' : 'Buổi học đang chờ Mentor tiếp nhận'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-900 text-slate-300">
                  {nextSession.format === 'ONE_ON_ONE' ? '1-kèm-1' : 'Học nhóm'}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {nextSession.courseCode}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium text-cyan-300">
                    <Calendar className="size-4 text-cyan-400" />
                    {new Date(nextSession.startAt).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                    <Clock className="size-3.5 text-cyan-400" />
                    {new Date(nextSession.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} (GMT+7) · {nextSession.durationMin} phút
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    Đã ký quỹ: {formatCurrency(nextSession.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Spotlight CTA */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {nextSession.status === 'ACCEPTED' && (
                <Button
                  onClick={() => setMeetBooking(nextSession)}
                  className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-5 text-sm font-bold text-white shadow-xl shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] transition-all gap-2"
                >
                  <Video className="size-4.5 animate-pulse" />
                  Vào Phòng Học Jitsi Meet Ngay
                </Button>
              )}
              {nextSession.status === 'TAUGHT' && (
                <Button
                  onClick={() => setConfirmBookingItem(nextSession)}
                  className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-sm font-bold text-white shadow-xl shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 hover:scale-[1.02] transition-all gap-2"
                >
                  <Check className="size-4.5" />
                  Xác nhận & Giải phóng tiền
                </Button>
              )}
              {nextSession.status === 'ESCROW_HELD' && (
                <Button
                  onClick={() => setViewBooking(nextSession)}
                  variant="outline"
                  className="rounded-2xl border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white"
                >
                  Xem chi tiết lịch hẹn
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Bento Grid KPI Metrics ───────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-xl hover:border-cyan-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lịch sắp tới</span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <CalendarClock className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{upcomingCount}</span>
            <span className="text-xs text-slate-400">buổi học</span>
          </div>
          <p className="mt-1 text-[11px] text-cyan-400/90 font-medium">Đã thanh toán ký quỹ an toàn</p>
        </div>

        {/* KPI 2 */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-xl hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Đã hoàn thành</span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">{completedCount}</span>
            <span className="text-xs text-slate-400">buổi học</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400/90 font-medium">Đã kết thúc & đánh giá</p>
        </div>

        {/* KPI 3 */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-xl hover:border-amber-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Thời lượng học</span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-300 tracking-tight">{totalHours.toFixed(1)}</span>
            <span className="text-xs text-slate-400">giờ học cùng Mentor</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-400/90 font-medium">Tích lũy kiến thức học thuật</p>
        </div>

        {/* KPI 4 */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-xl hover:border-blue-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng đầu tư học tập</span>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
              <Wallet className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(totalSpent)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Số dư ví: <strong className="text-emerald-400">{formatCurrency(profile?.walletBalance ?? 0)}</strong></span>
            <Link to="/dashboard/wallet" className="text-cyan-400 hover:underline font-semibold">Nạp ví →</Link>
          </div>
        </div>
      </div>

      {/* ── 4. Session Explorer (Search, Filter Tabs, Grid/Table Switcher) ─── */}
      <div className="space-y-5 rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 sm:p-7 backdrop-blur-xl shadow-2xl">
        
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm môn học, mentor hoặc mã lịch..."
              className="bg-slate-900/80 border-slate-800 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 rounded-2xl placeholder:text-slate-500 focus:border-cyan-500/50"
            />
          </div>

          {/* Right toggle controls */}
          <div className="flex items-center justify-between lg:justify-end gap-3">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Tìm thấy <strong className="text-white">{filtered.length}</strong> buổi học
            </span>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-2xl border border-slate-800 bg-slate-900/80 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                  viewMode === 'grid'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <LayoutGrid className="size-3.5" /> Thẻ
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                  viewMode === 'table'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <List className="size-3.5" /> Bảng
              </button>
            </div>
          </div>
        </div>

        {/* Tab Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap',
                tab === t.value
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <span>{t.label}</span>
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-extrabold',
                tab === t.value ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Content View (Grid or Table) ──────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="size-6 animate-spin text-cyan-400" />
            <p className="text-xs tracking-wider uppercase font-semibold">Đang tải lịch học…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="flex size-14 mx-auto items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400">
              <CalendarClock className="size-7 text-cyan-400/60" />
            </div>
            <h3 className="text-base font-bold text-white">Chưa có buổi học nào ở mục này</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Khi bạn đặt lịch hoặc hoàn thành buổi học, dữ liệu sẽ được hiển thị chi tiết tại đây.
            </p>
            <Link
              to="/mentors"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 mt-2"
            >
              Tìm Mentor & Đặt Lịch
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Mode */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl transition-all hover:border-cyan-500/40 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-cyan-950/20"
              >
                <div>
                  {/* Card Header: Course + Status */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                        {b.format === 'ONE_ON_ONE' ? '1-kèm-1' : 'Học nhóm'}
                      </span>
                      <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {b.courseCode}
                      </h4>
                    </div>
                    <StatusBadge status={b.displayStatus} />
                  </div>

                  {/* Card Body: Time, Duration, Mentor */}
                  <div className="py-3.5 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="size-3.5 text-cyan-400 shrink-0" />
                      <span className="font-semibold text-white">
                        {new Date(b.startAt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                      <span>·</span>
                      <Clock className="size-3.5 text-cyan-400 shrink-0" />
                      <span>{new Date(b.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({b.durationMin}p)</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                          {b.mentorName ? b.mentorName.charAt(0) : 'M'}
                        </div>
                        <span className="text-xs text-slate-300 font-medium truncate max-w-[140px]">
                          {b.mentorName || 'Mentor'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        {formatCurrency(b.price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-2 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => setViewBooking(b)}
                    className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Chi tiết
                  </button>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Action buttons */}
                    {b.status === 'ACCEPTED' && (
                      <Button
                        size="sm"
                        onClick={() => setMeetBooking(b)}
                        className="h-8 gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 text-xs font-bold text-white hover:from-cyan-400 hover:to-blue-500"
                      >
                        <Video className="size-3.5" /> Vào học
                      </Button>
                    )}

                    {b.status === 'TAUGHT' && (
                      <Button
                        size="sm"
                        onClick={() => setConfirmBookingItem(b)}
                        className="h-8 gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
                      >
                        <Check className="size-3.5" /> Xác nhận
                      </Button>
                    )}

                    {(b.status === 'TAUGHT' || b.status === 'COMPLETED') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAskBookingItem(b)}
                        className="h-8 gap-1 rounded-xl border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs"
                      >
                        <Sparkles className="size-3 text-cyan-400" /> AI hỏi bài
                      </Button>
                    )}

                    {b.status === 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReviewBookingItem(b)}
                        className="h-8 gap-1 rounded-xl border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs"
                      >
                        <Star className="size-3 text-amber-400" /> Đánh giá
                      </Button>
                    )}

                    {(b.status === 'ESCROW_HELD' || b.status === 'ACCEPTED') && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRescheduleBookingItem(b)}
                          className="h-8 px-2.5 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 text-xs"
                          title="Đổi lịch buổi học"
                        >
                          Đổi lịch
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCancelBookingItem(b)}
                          className="h-8 px-2 text-slate-400 hover:text-red-400 hover:bg-red-950/20 text-xs"
                          title="Hủy buổi học"
                        >
                          Hủy
                        </Button>
                      </>
                    )}

                    {(b.status === 'ESCROW_HELD' || b.status === 'ACCEPTED' || b.status === 'TAUGHT') && (() => {
                      const startMs = new Date(b.startAt).getTime();
                      const eligible = Date.now() >= startMs + 15 * 60 * 1000;
                      const eligibleAt = new Date(startMs + 15 * 60 * 1000);
                      const notice = `Chỉ được mở khiếu nại sau khi buổi học đã bắt đầu ít nhất 15 phút (từ ${eligibleAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${eligibleAt.toLocaleDateString('vi-VN')}). Trước mốc đó, vui lòng Hủy hoặc Đổi lịch.`;

                      return eligible ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDisputeBookingItem(b)}
                          className="h-8 px-2 text-red-400 hover:bg-red-950/20 text-xs"
                          title="Mở khiếu nại"
                        >
                          Khiếu nại
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          className="h-8 px-2 text-slate-500 cursor-not-allowed text-xs opacity-50"
                          title={notice}
                        >
                          Khiếu nại
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View Mode */
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
            <Table>
              <TableHeader className="bg-slate-900/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs font-bold uppercase">Môn học</TableHead>
                  <TableHead className="text-slate-400 text-xs font-bold uppercase">Thời gian (GMT+7)</TableHead>
                  <TableHead className="text-slate-400 text-xs font-bold uppercase">Mentor</TableHead>
                  <TableHead className="text-slate-400 text-xs font-bold uppercase">Học phí</TableHead>
                  <TableHead className="text-slate-400 text-xs font-bold uppercase">Trạng thái</TableHead>
                  <TableHead className="text-right text-slate-400 text-xs font-bold uppercase">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id} className="border-slate-800/60 hover:bg-slate-900/60 transition-colors">
                    <TableCell className="font-bold text-white text-xs">
                      <div>{b.courseCode}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{b.format === 'ONE_ON_ONE' ? '1-kèm-1' : 'Học nhóm'}</div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 whitespace-nowrap">
                      <div className="font-medium text-white">
                        {new Date(b.startAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(b.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {b.durationMin} phút
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 font-medium">
                      {b.mentorName || 'Mentor'}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-emerald-400">
                      {formatCurrency(b.price)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={b.displayStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewBooking(b)}
                          className="h-8 px-2 text-xs text-slate-300 hover:text-white"
                        >
                          Chi tiết
                        </Button>

                        {b.status === 'ACCEPTED' && (
                          <Button
                            size="sm"
                            onClick={() => setMeetBooking(b)}
                            className="h-8 gap-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-bold text-white"
                          >
                            <Video className="size-3.5" /> Vào học
                          </Button>
                        )}

                        {b.status === 'TAUGHT' && (
                          <Button
                            size="sm"
                            onClick={() => setConfirmBookingItem(b)}
                            className="h-8 gap-1 rounded-xl bg-emerald-600 text-xs font-bold text-white"
                          >
                            <Check className="size-3.5" /> Xác nhận
                          </Button>
                        )}

                        {(b.status === 'TAUGHT' || b.status === 'COMPLETED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAskBookingItem(b)}
                            className="h-8 gap-1 rounded-xl border-cyan-500/30 text-cyan-300 text-xs"
                          >
                            <Sparkles className="size-3" /> AI
                          </Button>
                        )}

                        {b.status === 'COMPLETED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReviewBookingItem(b)}
                            className="h-8 gap-1 rounded-xl border-amber-500/30 text-amber-300 text-xs"
                          >
                            <Star className="size-3" /> Đánh giá
                          </Button>
                        )}

                        {(b.status === 'ESCROW_HELD' || b.status === 'ACCEPTED') && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRescheduleBookingItem(b)}
                              className="h-8 px-2 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 text-xs"
                            >
                              Đổi lịch
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancelBookingItem(b)}
                              className="h-8 px-2 text-slate-400 hover:text-red-400 hover:bg-red-950/20 text-xs"
                            >
                              Hủy
                            </Button>
                          </>
                        )}

                        {(b.status === 'ESCROW_HELD' || b.status === 'ACCEPTED' || b.status === 'TAUGHT') && (() => {
                          const startMs = new Date(b.startAt).getTime();
                          const eligible = Date.now() >= startMs + 15 * 60 * 1000;
                          const eligibleAt = new Date(startMs + 15 * 60 * 1000);
                          const notice = `Chỉ được mở khiếu nại sau khi buổi học đã bắt đầu ít nhất 15 phút (từ ${eligibleAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${eligibleAt.toLocaleDateString('vi-VN')}). Trước mốc đó, vui lòng Hủy hoặc Đổi lịch.`;

                          return eligible ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDisputeBookingItem(b)}
                              className="h-8 px-2 text-xs text-red-400 hover:bg-red-950/20"
                            >
                              Khiếu nại
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled
                              className="h-8 px-2 text-xs text-slate-500 cursor-not-allowed opacity-50"
                              title={notice}
                            >
                              Khiếu nại
                            </Button>
                          );
                        })()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Active Modals ──────────────────────────────────────────────── */}
      {meetBooking && (
        <MeetRoomOverlay
          bookingId={meetBooking.id}
          roomId={meetBooking.roomId}
          course={meetBooking.courseCode}
          partnerName={meetBooking.mentorName ?? 'Mentor'}
          durationMinutes={meetBooking.durationMin}
          displayName={profile?.fullName || user?.name}
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
      {rescheduleBookingItem && (
        <RescheduleModal
          booking={rescheduleBookingItem}
          onClose={() => setRescheduleBookingItem(null)}
          onRescheduled={fetchBookings}
        />
      )}
      {cancelBookingItem && (
        <CancelBookingModal
          booking={cancelBookingItem}
          onClose={() => setCancelBookingItem(null)}
          onCancelled={fetchBookings}
        />
      )}
    </div>
  );
}
