import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, RefreshCcw, ShieldCheck, Loader2, Eye, Send, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { KpiCard } from '../../components/cards';
import { StatusBadge, EmptyState } from '../../components/common';
import { toast } from 'sonner';
import {
  getMentorSchedule, mapStatusToDisplay, respondDispute, type BookingResponse,
} from '../../services/bookingService';
import { useLanguage } from '../../context/LanguageContext';

export function TeacherDisputes() {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BookingResponse | null>(null);
  const [responding, setResponding] = useState(false);
  const [responseDraft, setResponseDraft] = useState('');
  const [evidenceDraft, setEvidenceDraft] = useState('');

  useEffect(() => {
    getMentorSchedule()
      .then(setBookings)
      .catch(() => toast.error(vi ? 'Không tải được danh sách khiếu nại.' : 'Failed to load disputes.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) {
      setResponseDraft(selected.disputeMentorResponse ?? '');
      setEvidenceDraft(selected.disputeMentorEvidenceUrl ?? '');
    }
  }, [selected]);

  // Disputes raised against this mentor's sessions.
  const disputes = useMemo(
    () => bookings.filter((b) => b.status === 'DISPUTED' || b.status === 'REFUNDED'),
    [bookings],
  );

  const counts = {
    open: disputes.filter((d) => d.status === 'DISPUTED').length,
    refunded: disputes.filter((d) => d.status === 'REFUNDED').length,
  };

  const handleSendResponse = async () => {
    if (!selected) return;
    if (!responseDraft.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi/giải trình đối chất.');
      return;
    }
    setResponding(true);
    try {
      const updated = await respondDispute(selected.id, {
        response: responseDraft.trim(),
        evidenceUrl: evidenceDraft.trim() || undefined,
      });
      toast.success('Đã gửi phản hồi khiếu nại thành công! Ban Quản trị sẽ xem xét cả hai bên.');
      setSelected(updated);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Không thể gửi phản hồi.');
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Khiếu nại & Giải quyết' : 'Disputes & Resolution'}</h1>
        <p className="mt-1 text-muted-foreground">
          {vi ? 'Khiếu nại của học viên đối với các buổi học của bạn. Bạn có thể gửi giải trình và bằng chứng để admin xem xét.' : 'Student complaints raised against your sessions. You can submit your explanations and evidence for admin review.'}
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label={vi ? 'Đang mở' : 'Open'} value={String(counts.open)} icon={AlertTriangle} tone="warning" />
        <KpiCard label={vi ? 'Đã hoàn tiền' : 'Refunded'} value={String(counts.refunded)} icon={RefreshCcw} tone="success" />
        <KpiCard label={vi ? 'Tổng giá trị' : 'Total value'} value={formatCurrency(disputes.reduce((s, d) => s + d.price, 0))} icon={ShieldCheck} />
      </div>

      <Card className="border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{vi ? 'Các vụ khiếu nại' : 'Dispute cases'}</h2>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> {vi ? 'Đang tải khiếu nại…' : 'Loading disputes…'}
          </div>
        ) : disputes.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{vi ? 'Học viên' : 'Student'}</TableHead>
                  <TableHead>{vi ? 'Môn học' : 'Course'}</TableHead>
                  <TableHead>{vi ? 'Vấn đề' : 'Issue'}</TableHead>
                  <TableHead>{vi ? 'Lý do' : 'Reason'}</TableHead>
                  <TableHead>{vi ? 'Trạng thái phản hồi' : 'Response Status'}</TableHead>
                  <TableHead>{vi ? 'Số tiền' : 'Amount'}</TableHead>
                  <TableHead>{vi ? 'Trạng thái' : 'Status'}</TableHead>
                  <TableHead className="text-right">{vi ? 'Thao tác' : 'Action'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell style={{ fontWeight: 500 }}>{d.menteeName ?? (vi ? 'Học viên' : 'Student')}</TableCell>
                    <TableCell className="text-muted-foreground">{d.courseCode}</TableCell>
                    <TableCell className="text-muted-foreground">{d.disputeIssueType ?? '—'}</TableCell>
                    <TableCell className="max-w-[200px] text-muted-foreground">
                      <span className="line-clamp-2" title={d.disputeReason ?? ''}>{d.disputeReason ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      {d.disputeMentorResponse ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                          <CheckCircle2 className="size-3" /> Đã phản hồi
                        </span>
                      ) : d.status === 'DISPUTED' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                          <AlertTriangle className="size-3" /> Cần đối chất
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(d.price)}</TableCell>
                    <TableCell><StatusBadge status={mapStatusToDisplay(d.status)} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(d)}>
                        <Eye className="size-4" /> {d.status === 'DISPUTED' && !d.disputeMentorResponse ? (vi ? 'Phản hồi' : 'Respond') : (vi ? 'Chi tiết' : 'Details')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title={vi ? 'Không có khiếu nại' : 'No disputes'}
            description={vi ? 'Chưa có khiếu nại nào của học viên đối với các buổi học của bạn.' : 'No student disputes have been raised against your sessions.'}
          />
        )}
      </Card>

      {/* Detail & Response dialog */}
      {selected && (
        <Dialog open onOpenChange={() => { if (!responding) setSelected(null); }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Chi tiết khiếu nại — {selected.courseCode}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Học viên</p>
                  <p style={{ fontWeight: 500 }}>{selected.menteeName ?? (vi ? 'Học viên' : 'Student')}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Số tiền ký quỹ</p>
                  <p style={{ fontWeight: 500 }}>{formatCurrency(selected.price)}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Loại khiếu nại</p>
                  <p style={{ fontWeight: 500 }}>{selected.disputeIssueType ?? '—'}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Trạng thái buổi học</p>
                  <StatusBadge status={mapStatusToDisplay(selected.status)} />
                </div>
              </div>

              <div>
                <p className="text-muted-foreground mb-1 font-medium">Lý do khiếu nại của học viên:</p>
                <div className="rounded-xl border border-border bg-accent/50 p-3 whitespace-pre-wrap text-foreground">
                  {selected.disputeReason ?? 'Không có mô tả chi tiết.'}
                </div>
              </div>

              {/* Mentor Counter-Response section */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-primary">Phản hồi & Bằng chứng của bạn (Mentor)</p>
                  {selected.disputeRespondedAt && (
                    <span className="text-xs text-muted-foreground">
                      Gửi lúc: {new Date(selected.disputeRespondedAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB')}
                    </span>
                  )}
                </div>

                {selected.status === 'DISPUTED' ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Cung cấp giải trình hoặc thông tin đối chất để Quản trị viên đưa ra phán quyết công bằng nhất:
                    </p>
                    <div>
                      <textarea
                        value={responseDraft}
                        onChange={(e) => setResponseDraft(e.target.value)}
                        placeholder="Nhập giải trình của bạn (ví dụ: đã dạy đủ giờ, bài tập đã giải thích, học viên vắng mặt không báo trước...)"
                        rows={4}
                        className="w-full rounded-lg border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Link bằng chứng đính kèm (Drive, Zoom recording, ảnh chụp chat...):
                      </label>
                      <input
                        type="url"
                        value={evidenceDraft}
                        onChange={(e) => setEvidenceDraft(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full rounded-lg border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        disabled={responding || !responseDraft.trim()}
                        onClick={handleSendResponse}
                        className="gap-1.5"
                      >
                        {responding ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                        {selected.disputeMentorResponse ? 'Cập nhật phản hồi' : 'Gửi phản hồi cho Admin'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div>
                    {selected.disputeMentorResponse ? (
                      <div className="space-y-1">
                        <p className="whitespace-pre-wrap">{selected.disputeMentorResponse}</p>
                        {selected.disputeMentorEvidenceUrl && (
                          <a
                            href={selected.disputeMentorEvidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline block pt-1"
                          >
                            Xem tài liệu đính kèm ↗
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Không có phản hồi đối chất nào được ghi nhận.</p>
                    )}
                  </div>
                )}
              </div>

              <p className="rounded-xl bg-warning/10 p-3 text-xs text-warning">
                ℹ️ Ban Quản trị DynForge sẽ đối chiếu thông tin từ cả học viên và mentor trước khi đưa ra quyết định giải ngân hoặc hoàn tiền.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

