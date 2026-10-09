import { useState, useEffect, useMemo } from 'react';
import { RefreshCcw, AlertTriangle, Loader2, TrendingUp, Wallet, HandCoins } from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { KpiCard } from '../../components/cards';
import { StatusBadge, EmptyState } from '../../components/common';
import { toast } from 'sonner';
import {
  listAdminTransactions, listAdminDisputes, resolveDispute,
  type AdminTransaction, type AdminDispute,
} from '../../services/adminService';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../lib/format';

const typeColor: Record<string, string> = {
  PAYOUT: 'bg-success/10 text-success border-success/20',
  WITHDRAWAL: 'bg-primary/10 text-primary border-primary/20',
  REFUND: 'bg-warning/10 text-warning border-warning/20',
};

export function AdminPayouts() {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [tab, setTab] = useState('payouts');
  const [txns, setTxns] = useState<AdminTransaction[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundTarget, setRefundTarget] = useState<AdminDispute | null>(null);
  const [acting, setActing] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      listAdminTransactions().catch(() => []),
      listAdminDisputes().catch(() => []),
    ]).then(([t, d]) => { setTxns(t); setDisputes(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const payouts = useMemo(() => txns.filter((t) => t.type === 'PAYOUT' || t.type === 'WITHDRAWAL'), [txns]);
  const refundTxns = useMemo(() => txns.filter((t) => t.type === 'REFUND'), [txns]);

  const totalPaidOut = payouts.reduce((s, t) => s + t.amount, 0);
  const totalRefunded = refundTxns.reduce((s, t) => s + t.amount, 0);

  const doRefund = async () => {
    if (!refundTarget) return;
    setActing(true);
    try {
      await resolveDispute(refundTarget.bookingId, false); // false = refund student
      toast.success(vi ? 'Đã hoàn tiền — tiền trả về ví của học viên.' : "Refund issued — funds returned to the student's wallet.");
      setRefundTarget(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Không thể hoàn tiền.' : 'Could not issue refund.'));
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Giải ngân & Hoàn tiền' : 'Payouts & Refunds'}</h1>
        <p className="mt-1 text-muted-foreground">{vi ? 'Sổ giải ngân cho mentor và hoàn tiền cho học viên với các buổi bị tranh chấp.' : 'Mentor payouts ledger and mentee refunds for disputed sessions.'}</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label={vi ? 'Tổng đã trả mentor' : 'Total paid to mentors'} value={formatCurrency(totalPaidOut)} icon={TrendingUp} tone="success" />
        <KpiCard label={vi ? 'Tổng đã hoàn tiền' : 'Total refunded'} value={formatCurrency(totalRefunded)} icon={Wallet} tone="warning" />
        <KpiCard label={vi ? 'Hoàn tiền chờ xử lý' : 'Pending refunds'} value={String(disputes.length)} icon={HandCoins} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="payouts">{vi ? 'Giải ngân Mentor' : 'Mentor Payouts'}</TabsTrigger>
          <TabsTrigger value="refunds">{vi ? 'Hoàn tiền học viên' : 'Mentee Refunds'}</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <Card className="border-border p-6">
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> {vi ? 'Đang tải…' : 'Loading…'}
          </div>
        </Card>
      ) : tab === 'payouts' ? (
        /* ── Mentor Payouts ledger ─────────────────────────────── */
        <Card className="border-border p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            {vi ? <>{payouts.length} giao dịch giải ngân · Tổng <strong>{formatCurrency(totalPaidOut)}</strong></> : <>{payouts.length} payout transactions · Total <strong>{formatCurrency(totalPaidOut)}</strong></>}
          </p>
          {payouts.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>{vi ? 'Loại' : 'Type'}</TableHead>
                    <TableHead>{vi ? 'Mô tả' : 'Description'}</TableHead>
                    <TableHead>{vi ? 'Ngày' : 'Date'}</TableHead>
                    <TableHead>{vi ? 'Số tiền' : 'Amount'}</TableHead>
                    <TableHead>{vi ? 'Trạng thái' : 'Status'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell style={{ fontWeight: 500 }}>{t.userName ?? t.userId.slice(0, 8)}</TableCell>
                      <TableCell><Badge className={`border ${typeColor[t.type] ?? 'border-border'}`}>{t.type}</Badge></TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">{t.description}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(t.createdAt, lang, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell style={{ fontWeight: 700 }}>{formatCurrency(t.amount)}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={TrendingUp} title={vi ? 'Chưa có khoản giải ngân' : 'No payouts yet'} description={vi ? 'Các khoản giải ngân và rút tiền của mentor sẽ hiển thị ở đây.' : 'Mentor payouts and withdrawals will appear here.'} />
          )}
        </Card>
      ) : (
        /* ── Mentee Refunds ────────────────────────────────────── */
        <div className="space-y-6">
          <Card className="border-border p-6">
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {vi ? 'Hoàn tiền một buổi bị tranh chấp sẽ trả ký quỹ về ví học viên và đóng tranh chấp.' : "Refunding a disputed session releases the escrow back to the mentee's wallet and closes the dispute."}
            </div>
            <h2 className="mb-3" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{vi ? 'Buổi bị tranh chấp (chờ quyết định)' : 'Disputed sessions (awaiting decision)'}</h2>
            {disputes.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{vi ? 'Học viên' : 'Student'}</TableHead>
                      <TableHead>Mentor</TableHead>
                      <TableHead>{vi ? 'Môn học' : 'Course'}</TableHead>
                      <TableHead>{vi ? 'Lý do' : 'Reason'}</TableHead>
                      <TableHead>{vi ? 'Số tiền' : 'Amount'}</TableHead>
                      <TableHead className="text-right">{vi ? 'Thao tác' : 'Action'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((d) => (
                      <TableRow key={d.bookingId}>
                        <TableCell style={{ fontWeight: 500 }}>{d.menteeName ?? d.menteeId.slice(0, 8)}</TableCell>
                        <TableCell className="text-muted-foreground">{d.mentorName ?? d.mentorId.slice(0, 8)}</TableCell>
                        <TableCell className="text-muted-foreground">{d.courseCode}</TableCell>
                        <TableCell className="max-w-[220px] text-muted-foreground">
                          <span className="line-clamp-2" title={d.reason ?? ''}>{d.reason ?? d.issueType ?? '—'}</span>
                        </TableCell>
                        <TableCell style={{ fontWeight: 600 }}>{formatCurrency(d.price)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="gap-1.5 text-danger border-danger/30 hover:bg-danger/5" onClick={() => setRefundTarget(d)}>
                            <RefreshCcw className="size-3.5" /> {vi ? 'Hoàn tiền' : 'Refund'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState icon={RefreshCcw} title={vi ? 'Không có hoàn tiền chờ xử lý' : 'No pending refunds'} description={vi ? 'Các buổi bị tranh chấp đang chờ quyết định hoàn tiền sẽ hiển thị ở đây.' : 'Disputed sessions awaiting a refund decision will appear here.'} />
            )}
          </Card>

          {/* Refund history */}
          <Card className="border-border p-6">
            <h2 className="mb-3" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{vi ? 'Lịch sử hoàn tiền' : 'Refund history'}</h2>
            {refundTxns.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{vi ? 'Học viên' : 'Student'}</TableHead>
                      <TableHead>{vi ? 'Mô tả' : 'Description'}</TableHead>
                      <TableHead>{vi ? 'Ngày' : 'Date'}</TableHead>
                      <TableHead>{vi ? 'Số tiền' : 'Amount'}</TableHead>
                      <TableHead>{vi ? 'Trạng thái' : 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refundTxns.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell style={{ fontWeight: 500 }}>{t.userName ?? t.userId.slice(0, 8)}</TableCell>
                        <TableCell className="max-w-[260px] truncate text-muted-foreground">{t.description}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDate(t.createdAt, lang, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</TableCell>
                        <TableCell><StatusBadge status={t.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{vi ? 'Chưa có khoản hoàn tiền nào.' : 'No refunds issued yet.'}</p>
            )}
          </Card>
        </div>
      )}

      {/* Refund confirm dialog */}
      {refundTarget && (
        <Dialog open onOpenChange={() => !acting && setRefundTarget(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCcw className="size-5 text-danger" /> {vi ? 'Thực hiện hoàn tiền' : 'Issue refund'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  [vi ? 'Học viên' : 'Student', refundTarget.menteeName ?? refundTarget.menteeId],
                  ['Mentor', refundTarget.mentorName ?? refundTarget.mentorId],
                  [vi ? 'Môn học' : 'Course', refundTarget.courseCode],
                  [vi ? 'Số tiền' : 'Amount', formatCurrency(refundTarget.price)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border p-3">
                    <p className="text-muted-foreground">{label}</p>
                    <p style={{ fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>
              {refundTarget.reason && (
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground mb-1">{vi ? 'Lý do của học viên' : "Student's reason"}</p>
                  <p className="whitespace-pre-wrap">{refundTarget.reason}</p>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-xl bg-danger/5 border border-danger/20 p-3 text-danger">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {vi ? 'Toàn bộ số tiền ký quỹ sẽ được hoàn về ví học viên. Thao tác này đóng tranh chấp.' : "The full escrow amount will be credited back to the student's wallet. This closes the dispute."}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setRefundTarget(null)} disabled={acting}>{vi ? 'Huỷ' : 'Cancel'}</Button>
              <Button variant="destructive" onClick={doRefund} disabled={acting}>
                {acting ? <Loader2 className="size-4 animate-spin" /> : <><RefreshCcw className="size-4" /> {vi ? 'Xác nhận hoàn tiền' : 'Confirm refund'}</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
