import { useState, useEffect, useCallback } from 'react';
import { Video, CheckCircle2, Eye, AlertTriangle, Loader2, Check, X } from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { StatusBadge, EmptyState } from '../../components/common';
import { MeetRoomOverlay } from '../../components/MeetRoomOverlay';
import { CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  getMentorSchedule, markTaught, acceptBooking, declineBooking, mapStatusToDisplay, respondRescheduleBooking,
  type BookingResponse, type BookingStatus,
} from '../../services/bookingService';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../lib/format';

const tabs = ['All', 'Requests', 'Reschedule', 'Accepted', 'Taught', 'Completed', 'Cancelled'];
const TAB_LABELS_VI: Record<string, string> = {
  All: 'Tất cả', Requests: 'Yêu cầu', Reschedule: 'Đổi lịch', Accepted: 'Đã nhận',
  Taught: 'Đã dạy', Completed: 'Hoàn tất', Cancelled: 'Đã huỷ',
};

function mentorStatusTab(status: BookingStatus): string {
  switch (status) {
    case 'PENDING_PAYMENT': return 'Pending Payment';
    case 'ESCROW_HELD':     return 'Requests';
    case 'ACCEPTED':        return 'Accepted';
    case 'TAUGHT':          return 'Taught';
    case 'COMPLETED':       return 'Completed';
    case 'CANCELLED':       return 'Cancelled';
    case 'REFUNDED':        return 'Cancelled';
    default:                return mapStatusToDisplay(status);
  }
}

export function TeacherSessions() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const tabLabel = (t: string) => (vi ? TAB_LABELS_VI[t] ?? t : t);
  const [tab, setTab] = useState('All');
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [meetBooking, setMeetBooking] = useState<BookingResponse | null>(null);
  const [viewBooking, setViewBooking] = useState<BookingResponse | null>(null);
  const [markDoneBooking, setMarkDoneBooking] = useState<BookingResponse | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<BookingResponse | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getMentorSchedule();
      setBookings(data);
    } catch (err: any) {
      console.error('fetchBookings error:', err);
      toast.error(err?.response?.data?.message ?? (vi ? 'Không tải được danh sách buổi học.' : 'Failed to load sessions.'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAccept = async (b: BookingResponse) => {
    setActingId(b.id);
    try {
      await acceptBooking(b.id);
      toast.success(vi ? 'Đã chấp nhận yêu cầu. Học viên đã được thông báo.' : 'Request accepted. The student has been notified.');
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Chấp nhận yêu cầu thất bại.' : 'Failed to accept request.'));
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (b: BookingResponse) => {
    setActingId(b.id);
    try {
      await declineBooking(b.id);
      toast.success(vi ? 'Đã từ chối yêu cầu. Học viên đã được hoàn tiền.' : 'Request declined. The student has been refunded.');
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Từ chối yêu cầu thất bại.' : 'Failed to decline request.'));
    } finally {
      setActingId(null);
    }
  };

  const handleAcceptReschedule = async (b: BookingResponse) => {
    setActingId(b.id);
    try {
      await respondRescheduleBooking(b.id, true);
      toast.success('Đã chấp nhận yêu cầu đổi lịch! Lịch dạy mới đã được cập nhật.');
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Chấp nhận đổi lịch thất bại.');
    } finally {
      setActingId(null);
    }
  };

  const handleDeclineReschedule = async (b: BookingResponse) => {
    setActingId(b.id);
    try {
      await respondRescheduleBooking(b.id, false);
      toast.info('Đã từ chối yêu cầu đổi lịch. Buổi học giữ nguyên lịch ban đầu.');
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Từ chối đổi lịch thất bại.');
    } finally {
      setActingId(null);
    }
  };

  const pendingRescheduleCount = bookings.filter((b) => !!b.pendingStartAt).length;

  const withTab = bookings.map((b) => ({ ...b, tabStatus: mentorStatusTab(b.status) }));
  const filtered = tab === 'All'
    ? withTab
    : tab === 'Reschedule'
    ? withTab.filter((b) => !!b.pendingStartAt)
    : withTab.filter((b) => b.tabStatus === tab);


  const handleMarkDone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markDoneBooking) return;
    try {
      await markTaught(markDoneBooking.id);
      toast.success(vi ? 'Đã đánh dấu đã dạy. Đang chờ học viên xác nhận.' : 'Session marked as taught. Waiting for student confirmation.');
      fetchBookings();
      setMarkDoneBooking(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Đánh dấu buổi học thất bại.' : 'Failed to mark session.'));
    }
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(vi ? 'Phản hồi của bạn đã được gửi tới DynForge.' : 'Your response has been submitted to DynForge.');
    setDisputeBooking(null);
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Buổi học của tôi' : 'My Sessions'}</h1>
        <p className="mt-1 text-muted-foreground">
          {vi ? 'Quản lý lịch đặt của học viên — vào lớp, đánh dấu đã dạy và theo dõi hoàn tất.' : 'Manage student bookings — join, mark as taught, and track completion.'}
        </p>
      </div>

      <Card className="border-border p-5">
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="flex-wrap">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t} className="relative">
                {tabLabel(t)}
                {t === 'Reschedule' && pendingRescheduleCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                    {pendingRescheduleCount}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {pendingRescheduleCount > 0 && tab !== 'Reschedule' && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <span>{vi ? <>Bạn có <strong>{pendingRescheduleCount}</strong> yêu cầu đổi lịch từ học viên cần phê duyệt.</> : <>You have <strong>{pendingRescheduleCount}</strong> reschedule request(s) from students to approve.</>}</span>
            </div>
            <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs h-7" onClick={() => setTab('Reschedule')}>
              {vi ? 'Xem yêu cầu' : 'View requests'}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> {vi ? 'Đang tải buổi học…' : 'Loading sessions…'}
          </div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{vi ? 'Môn học' : 'Course'}</TableHead>
                  <TableHead>{vi ? 'Ngày & Giờ' : 'Date & Time'}</TableHead>
                  <TableHead>{vi ? 'Thời lượng' : 'Duration'}</TableHead>
                  <TableHead>{vi ? 'Hình thức' : 'Format'}</TableHead>
                  <TableHead>{vi ? 'Số tiền' : 'Amount'}</TableHead>
                  <TableHead>{vi ? 'Trạng thái' : 'Status'}</TableHead>
                  <TableHead className="text-right">{vi ? 'Thao tác' : 'Action'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id} className={b.pendingStartAt ? 'bg-amber-950/10 border-amber-500/20' : ''}>
                    <TableCell style={{ fontWeight: 500 }}>
                      <div>{b.courseCode}</div>
                      {b.pendingStartAt && (
                        <span className="inline-block mt-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded">
                          {vi ? 'Đang xin đổi lịch' : 'Reschedule requested'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      <div>
                        {formatDate(b.startAt, lang, { day: '2-digit', month: '2-digit' })}
                        {' · '}
                        {new Date(b.startAt).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {b.pendingStartAt && (
                        <div className="mt-1 text-xs text-amber-400 font-semibold flex items-center gap-1">
                          <span>↳ {vi ? 'Đề xuất:' : 'Proposed:'}</span>
                          <span>{new Date(b.pendingStartAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{b.durationMin} {vi ? 'phút' : 'min'}</TableCell>
                    <TableCell className="text-muted-foreground">{b.format.replace('_', '-')}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(b.price)}</TableCell>
                    <TableCell><StatusBadge status={b.tabStatus} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5 items-center flex-wrap">
                        {b.pendingStartAt && (
                          <div className="flex items-center gap-1 bg-amber-950/30 border border-amber-500/30 p-1 rounded-lg">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs h-7 px-2"
                              disabled={actingId === b.id}
                              onClick={() => handleDeclineReschedule(b)}
                              title={vi ? 'Từ chối yêu cầu đổi lịch' : 'Decline reschedule request'}
                            >
                              <X className="size-3" /> {vi ? 'Từ chối dời' : 'Decline'}
                            </Button>
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-7 px-2"
                              disabled={actingId === b.id}
                              onClick={() => handleAcceptReschedule(b)}
                              title={vi ? 'Đồng ý đổi sang giờ mới' : 'Accept the new time'}
                            >
                              {actingId === b.id ? <Loader2 className="size-3 animate-spin" /> : <><Check className="size-3" /> {vi ? 'Đồng ý dời' : 'Accept'}</>}
                            </Button>
                          </div>
                        )}
                        {b.status === 'ESCROW_HELD' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-danger border-danger/30 hover:bg-danger/5"
                              disabled={actingId === b.id}
                              onClick={() => handleDecline(b)}
                            >
                              <X className="size-3.5" /> {vi ? 'Từ chối' : 'Decline'}
                            </Button>
                            <Button
                              size="sm"
                              disabled={actingId === b.id}
                              onClick={() => handleAccept(b)}
                            >
                              {actingId === b.id
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <><Check className="size-3.5" /> {vi ? 'Chấp nhận' : 'Accept'}</>}
                            </Button>
                          </>
                        )}
                        {b.status === 'ACCEPTED' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setViewBooking(b)}>
                              <Eye className="size-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setMarkDoneBooking(b)}>
                              {vi ? 'Đánh dấu đã dạy' : 'Mark done'}
                            </Button>
                            <Button size="sm" className="gap-1.5" onClick={() => setMeetBooking(b)}>
                              <Video className="size-3.5" /> {vi ? 'Vào lớp' : 'Join'}
                            </Button>
                          </>
                        )}
                        {(b.status === 'COMPLETED' || b.status === 'TAUGHT') && (
                          <Button size="sm" variant="outline" onClick={() => setViewBooking(b)}>
                            <Eye className="size-3.5" /> {vi ? 'Xem' : 'View'}
                          </Button>
                        )}
                        {b.status === 'DISPUTED' && (
                          <Button size="sm" variant="outline" className="text-warning border-warning/30" onClick={() => setDisputeBooking(b)}>
                            <AlertTriangle className="size-3.5" /> {vi ? 'Phản hồi' : 'Respond'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={CalendarCheck}
            title={vi ? `Không có buổi học ${tabLabel(tab).toLowerCase()}` : `No ${tab.toLowerCase()} sessions`}
            description={vi ? 'Buổi học do học viên đặt sẽ hiển thị ở đây khi họ đặt lịch với bạn.' : 'Sessions from students will appear here once they book with you.'}
          />
        )}
      </Card>

      {/* Meet room */}
      {meetBooking && (
        <MeetRoomOverlay
          bookingId={meetBooking.id}
          roomId={meetBooking.roomId}
          course={meetBooking.courseCode}
          partnerName={meetBooking.menteeName ?? (vi ? 'Học viên' : 'Student')}
          durationMinutes={meetBooking.durationMin}
          displayName={user?.name}
          onClose={() => setMeetBooking(null)}
        />
      )}

      {/* View detail */}
      {viewBooking && (
        <Dialog open onOpenChange={() => setViewBooking(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader><DialogTitle>{vi ? 'Chi tiết buổi học' : 'Session details'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontWeight: 600 }}>{viewBooking.courseCode}</p>
                  <p className="text-sm text-muted-foreground">{viewBooking.format.replace('_', '-')}</p>
                </div>
                <StatusBadge status={mapStatusToDisplay(viewBooking.status)} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  [vi ? 'Ngày' : 'Date', formatDate(viewBooking.startAt, lang, { day: '2-digit', month: 'short', year: 'numeric' })],
                  [vi ? 'Giờ' : 'Time', new Date(viewBooking.startAt).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' })],
                  [vi ? 'Thời lượng' : 'Duration', `${viewBooking.durationMin} ${vi ? 'phút' : 'min'}`],
                  [vi ? 'Thực nhận của bạn' : 'Your payout', formatCurrency(Math.round(viewBooking.price * (1 - viewBooking.commissionRate)))],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border p-3">
                    <p className="text-muted-foreground">{label}</p>
                    <p style={{ fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewBooking(null)}>{vi ? 'Đóng' : 'Close'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Mark done modal */}
      {markDoneBooking && (
        <Dialog open onOpenChange={() => setMarkDoneBooking(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-success" /> {vi ? 'Đánh dấu đã dạy xong' : 'Mark session as taught'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleMarkDone} className="space-y-4">
              <div className="rounded-xl border border-border p-4">
                <p style={{ fontWeight: 600 }}>{markDoneBooking.courseCode} · {markDoneBooking.durationMin} {vi ? 'phút' : 'min'}</p>
                <p className="text-sm text-muted-foreground">{formatDate(markDoneBooking.startAt, lang, { weekday: 'long', day: '2-digit', month: 'short' })}</p>
              </div>
              <div>
                <Label className="mb-1.5 block">{vi ? 'Ghi chú buổi học' : 'Session notes'} <span className="text-muted-foreground">{vi ? '(tuỳ chọn)' : '(optional)'}</span></Label>
                <Textarea placeholder={vi ? 'Thêm ghi chú về nội dung đã dạy, bài tập giao, hoặc việc cần theo dõi…' : 'Add notes about what was covered, homework given, or follow-up...'} rows={3} />
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                {vi
                  ? `Đánh dấu đã dạy sẽ báo học viên xác nhận. ${formatCurrency(Math.round(markDoneBooking.price * (1 - markDoneBooking.commissionRate)))} sẽ được ghi có khi xác nhận.`
                  : `Marking as taught notifies the student to confirm. ${formatCurrency(Math.round(markDoneBooking.price * (1 - markDoneBooking.commissionRate)))} will be credited once confirmed.`}
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setMarkDoneBooking(null)}>{vi ? 'Huỷ' : 'Cancel'}</Button>
                <Button type="submit">{vi ? 'Xác nhận hoàn tất' : 'Confirm completion'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Respond to dispute */}
      {disputeBooking && (
        <Dialog open onOpenChange={() => setDisputeBooking(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-warning" /> {vi ? 'Phản hồi khiếu nại' : 'Respond to dispute'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div className="rounded-xl border border-border bg-accent/40 p-4">
                <p style={{ fontWeight: 600 }}>{disputeBooking.courseCode}</p>
                <StatusBadge status={mapStatusToDisplay(disputeBooking.status)} />
              </div>
              <div>
                <Label className="mb-1.5 block">{vi ? 'Phản hồi của bạn' : 'Your response'}</Label>
                <Textarea placeholder={vi ? 'Trình bày rõ ràng, trung thực quan điểm của bạn. DynForge sẽ xem xét công bằng cả hai bên.' : 'Explain your side of the situation clearly and factually. DynForge will review both sides fairly.'} rows={4} required />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDisputeBooking(null)}>{vi ? 'Huỷ' : 'Cancel'}</Button>
                <Button type="submit">{vi ? 'Gửi phản hồi' : 'Submit response'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
