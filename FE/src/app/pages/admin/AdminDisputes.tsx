import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
  listAdminDisputes, resolveDispute,
  type AdminDispute,
} from '../../services/adminService';
import { useLanguage } from '../../context/LanguageContext';

export function AdminDisputes() {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminDispute | null>(null);
  const [acting, setActing] = useState(false);

  const openReview = (d: AdminDispute) => {
    setSelected(d);
  };

  const fetchDisputes = () => {
    setLoading(true);
    listAdminDisputes()
      .then(setDisputes)
      .catch(() => toast.error(vi ? 'Không tải được tranh chấp.' : 'Failed to load disputes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDisputes(); }, []);

  const decide = async (releaseToMentor: boolean) => {
    if (!selected) return;
    setActing(true);
    try {
      await resolveDispute(selected.bookingId, releaseToMentor);
      toast.success(releaseToMentor
        ? (vi ? 'Đã xử lý tranh chấp — giải ngân cho mentor.' : 'Dispute resolved — payment released to mentor.')
        : (vi ? 'Đã xử lý tranh chấp — hoàn tiền cho học viên.' : 'Dispute resolved — student refunded.'));
      setSelected(null);
      fetchDisputes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Không thể xử lý tranh chấp.' : 'Could not resolve dispute.'));
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Quản lý tranh chấp' : 'Dispute Management'}</h1>
        <p className="mt-1 text-muted-foreground">{vi ? 'Xem xét và giải quyết tranh chấp giữa học viên và mentor một cách công bằng.' : 'Review and resolve student–mentor disputes fairly.'}</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label={vi ? 'Tranh chấp đang mở' : 'Open disputes'} value={String(disputes.length)} icon={AlertTriangle} tone="warning" />
        <KpiCard label={vi ? 'Tổng giá trị' : 'Total value'} value={formatCurrency(disputes.reduce((s, d) => s + d.price, 0))} icon={AlertTriangle} />
        <KpiCard label={vi ? 'Số mentor liên quan' : 'Mentors involved'} value={String(new Set(disputes.map((d) => d.mentorId)).size)} icon={AlertTriangle} />
      </div>

      <Card className="border-border p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> {vi ? 'Đang tải tranh chấp…' : 'Loading disputes…'}
          </div>
        ) : disputes.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{vi ? 'Lịch đặt' : 'Booking'}</TableHead>
                  <TableHead>{vi ? 'Học viên' : 'Student'}</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>{vi ? 'Môn học' : 'Course'}</TableHead>
                  <TableHead>{vi ? 'Vấn đề' : 'Issue'}</TableHead>
                  <TableHead>{vi ? 'Số tiền' : 'Amount'}</TableHead>
                  <TableHead className="text-right">{vi ? 'Thao tác' : 'Action'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.bookingId}>
                    <TableCell style={{ fontWeight: 500 }}>{d.bookingId.slice(0, 8)}…</TableCell>
                    <TableCell className="text-muted-foreground">{d.menteeName ?? d.menteeId.slice(0, 8)}</TableCell>
                    <TableCell className="text-muted-foreground">{d.mentorName ?? d.mentorId.slice(0, 8)}</TableCell>
                    <TableCell className="text-muted-foreground">{d.courseCode}</TableCell>
                    <TableCell className="max-w-[200px] text-muted-foreground">
                      <span className="line-clamp-2" title={d.reason ?? ''}>{d.issueType ?? d.reason ?? '—'}</span>
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(d.price)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openReview(d)}>{vi ? 'Xét duyệt' : 'Review'}</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState icon={AlertTriangle} title={vi ? 'Không có tranh chấp' : 'No disputes'} description={vi ? 'Tất cả tranh chấp đã được giải quyết.' : 'All disputes have been resolved.'} />
        )}
      </Card>

      {/* Admin decision dialog */}
      {selected && (
        <Dialog open onOpenChange={() => { if (!acting) setSelected(null); }}>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>{vi ? 'Xử lý tranh chấp' : 'Resolve dispute'} — {selected.bookingId.slice(0, 8)}…</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">{vi ? 'Học viên' : 'Student'}</p>
                  <p style={{ fontWeight: 500 }}>{selected.menteeName ?? selected.menteeId}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Mentor</p>
                  <p style={{ fontWeight: 500 }}>{selected.mentorName ?? selected.mentorId}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">{vi ? 'Môn học' : 'Course'}</p>
                  <p style={{ fontWeight: 500 }}>{selected.courseCode}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">{vi ? 'Số tiền ký quỹ' : 'Amount in escrow'}</p>
                  <p style={{ fontWeight: 500 }}>{formatCurrency(selected.price)}</p>
                </div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground">{vi ? 'Loại vấn đề' : 'Issue type'}</p>
                <p style={{ fontWeight: 500 }}>{selected.issueType ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground mb-1">{vi ? 'Lý do của học viên' : "Student's reason (Mentee)"}</p>
                <p className="whitespace-pre-wrap">{selected.reason ?? (vi ? 'Không có lý do.' : 'No reason provided.')}</p>
              </div>

              {selected.mentorResponse ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-primary">{vi ? 'Phản hồi đối chất của Mentor' : "Mentor's Counter-Response"}</p>
                    {selected.mentorRespondedAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(selected.mentorRespondedAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB')}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-foreground">{selected.mentorResponse}</p>
                  {selected.mentorEvidenceUrl && (
                    <div className="pt-1">
                      <a
                        href={selected.mentorEvidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline hover:text-primary/80 inline-flex items-center gap-1"
                      >
                        {vi ? 'Xem tài liệu / bằng chứng đính kèm ↗' : 'View attached document / evidence ↗'}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-500">
                  {vi ? 'Mentor chưa gửi phản hồi hoặc giải trình đối chất cho khiếu nại này.' : 'The mentor has not submitted a response or counter-evidence for this dispute.'}
                </div>
              )}

              <p className="rounded-xl bg-warning/10 p-3 text-warning">
                {vi ? 'Chọn kết quả: hoàn tiền cho học viên, hoặc giải ngân ký quỹ cho mentor.' : 'Choose an outcome: refund the student, or release the escrow to the mentor.'}
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="text-success border-success/30" disabled={acting} onClick={() => decide(false)}>
                {acting ? <Loader2 className="size-4 animate-spin" /> : (vi ? 'Hoàn tiền học viên' : 'Refund student')}
              </Button>
              <Button disabled={acting} onClick={() => decide(true)}>
                {acting ? <Loader2 className="size-4 animate-spin" /> : (vi ? 'Giải ngân cho mentor' : 'Release to mentor')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
