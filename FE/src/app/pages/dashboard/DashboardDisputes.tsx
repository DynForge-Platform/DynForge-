import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, RefreshCcw, Plus, Loader2, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { KpiCard } from '../../components/cards';
import { StatusBadge, EmptyState } from '../../components/common';
import { toast } from 'sonner';
import {
  getMyBookings, disputeBooking, mapStatusToDisplay, type BookingResponse,
} from '../../services/bookingService';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../lib/format';

const issueTypes = [
  'Session not attended',
  'Quality concern',
  'Refund request',
  'Technical issue',
  'Mentor misconduct',
  'Other',
];

const issueTypeLabelsVi: Record<string, string> = {
  'Session not attended': 'Không tham gia buổi học',
  'Quality concern': 'Lo ngại về chất lượng',
  'Refund request': 'Yêu cầu hoàn tiền',
  'Technical issue': 'Lỗi kỹ thuật',
  'Mentor misconduct': 'Mentor vi phạm',
  'Other': 'Khác',
};

export function DashboardDisputes() {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const issueLabel = (t: string) => (vi ? issueTypeLabelsVi[t] ?? t : t);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [issueType, setIssueType] = useState(issueTypes[0]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      setBookings(await getMyBookings());
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Không tải được danh sách tranh chấp.' : 'Failed to load disputes.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // The mentee's dispute cases = bookings that are disputed or refunded.
  const disputes = useMemo(
    () => bookings.filter((b) => b.status === 'DISPUTED' || b.status === 'REFUNDED'),
    [bookings],
  );
  // Any paid, not-yet-completed session can be disputed.
  const disputable = useMemo(
    () => bookings.filter((b) => b.status === 'ESCROW_HELD' || b.status === 'ACCEPTED' || b.status === 'TAUGHT'),
    [bookings],
  );

  const counts = {
    open: disputes.filter((d) => d.status === 'DISPUTED').length,
    refunded: disputes.filter((d) => d.status === 'REFUNDED').length,
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) { toast.error(vi ? 'Vui lòng chọn một buổi học.' : 'Please select a session.'); return; }
    if (!reason.trim()) { toast.error(vi ? 'Vui lòng mô tả vấn đề.' : 'Please describe the problem.'); return; }
    setSubmitting(true);
    try {
      await disputeBooking(selectedBookingId, issueType, reason.trim());
      toast.success(vi ? 'Đã gửi tranh chấp. DynForge sẽ xem xét trong vòng 48 giờ.' : 'Dispute submitted. DynForge will review it within 48 hours.');
      setOpen(false);
      setSelectedBookingId('');
      setReason('');
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Không mở được tranh chấp.' : 'Could not open dispute.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Tranh chấp & Khiếu nại' : 'Disputes & Complaints'}</h1>
          <p className="mt-1 text-muted-foreground">
            {vi ? 'Mở và theo dõi các yêu cầu hỗ trợ về buổi học, hoàn tiền hoặc vấn đề với mentor.' : 'Open and track support requests for sessions, refunds, or mentor issues.'}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={disputable.length === 0}>
          <Plus className="size-4" /> {vi ? 'Mở tranh chấp mới' : 'Open New Dispute'}
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label={vi ? 'Đang mở' : 'Open'} value={String(counts.open)} icon={AlertTriangle} tone="warning" />
        <KpiCard label={vi ? 'Đã hoàn tiền' : 'Refunded'} value={String(counts.refunded)} icon={RefreshCcw} tone="success" />
        <KpiCard label={vi ? 'Tổng giá trị' : 'Total value'} value={formatCurrency(disputes.reduce((s, d) => s + d.price, 0))} icon={ShieldCheck} />
      </div>

      <Card className="border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{vi ? 'Tranh chấp của tôi' : 'My disputes'}</h2>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> {vi ? 'Đang tải tranh chấp…' : 'Loading disputes…'}
          </div>
        ) : disputes.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{vi ? 'Môn học' : 'Course'}</TableHead>
                  <TableHead>{vi ? 'Vấn đề' : 'Issue'}</TableHead>
                  <TableHead>{vi ? 'Lý do' : 'Reason'}</TableHead>
                  <TableHead>{vi ? 'Số tiền' : 'Amount'}</TableHead>
                  <TableHead>{vi ? 'Trạng thái' : 'Status'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell style={{ fontWeight: 500 }}>{d.courseCode}</TableCell>
                    <TableCell className="text-muted-foreground">{d.disputeIssueType ? issueLabel(d.disputeIssueType) : '—'}</TableCell>
                    <TableCell className="max-w-[280px] text-muted-foreground">
                      {d.disputeReason
                        ? <span className="line-clamp-2" title={d.disputeReason}>{d.disputeReason}</span>
                        : '—'}
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(d.price)}</TableCell>
                    <TableCell><StatusBadge status={mapStatusToDisplay(d.status)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title={vi ? 'Chưa có tranh chấp nào' : 'No disputes yet'}
            description={vi ? 'Khi có vấn đề với một buổi học đã dạy, bạn có thể mở tranh chấp và DynForge sẽ xem xét một cách công bằng.' : 'When something goes wrong with a taught session, you can open a dispute and DynForge will review it fairly.'}
            action={disputable.length > 0 ? <Button onClick={() => setOpen(true)}>{vi ? 'Mở tranh chấp' : 'Open a Dispute'}</Button> : undefined}
          />
        )}
      </Card>

      {/* New dispute dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{vi ? 'Mở tranh chấp mới' : 'Open a new dispute'}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <Label className="mb-1.5 block">{vi ? 'Buổi học liên quan' : 'Related session'}</Label>
              <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                <SelectTrigger><SelectValue placeholder={vi ? 'Chọn một buổi học' : 'Select a session'} /></SelectTrigger>
                <SelectContent>
                  {disputable.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.courseCode} — {formatDate(b.startAt, lang, { day: '2-digit', month: 'short' })} · {formatCurrency(b.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">{vi ? 'Loại vấn đề' : 'Issue type'}</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger><SelectValue placeholder={vi ? 'Chọn loại vấn đề' : 'Select issue type'} /></SelectTrigger>
                <SelectContent>
                  {issueTypes.map((t) => <SelectItem key={t} value={t}>{issueLabel(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">{vi ? 'Mô tả vấn đề' : 'Describe the problem'}</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={vi ? 'Vui lòng mô tả chi tiết điều đã xảy ra…' : 'Please describe what happened in detail…'} rows={4} />
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-accent/60 p-3 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              {vi ? 'Mở tranh chấp sẽ tạm dừng việc giải ngân. DynForge xem xét mọi tranh chấp công bằng trong vòng 48 giờ.' : 'Opening a dispute pauses the payout. DynForge reviews all disputes fairly within 48 hours.'}
            </div>
            <DialogFooter className="gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{vi ? 'Huỷ' : 'Cancel'}</Button>
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : (vi ? 'Gửi tranh chấp' : 'Submit Dispute')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
