import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Eye } from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { StatusBadge } from '../../components/common';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { listAdminTransactions, listAdminUsers, type AdminTransaction } from '../../services/adminService';
import type { UserProfile } from '../../services/userService';
import { getBookingById, mapStatusToDisplay, type BookingResponse } from '../../services/bookingService';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate, formatDateTime } from '../../lib/format';

const TYPES = ['All', 'TOPUP', 'PAYMENT', 'PAYOUT', 'REFUND', 'WITHDRAWAL', 'COMMISSION'];

const typeColor: Record<string, string> = {
  TOPUP: 'bg-primary/10 text-primary border-primary/20',
  PAYMENT: 'bg-warning/10 text-warning border-warning/20',
  PAYOUT: 'bg-success/10 text-success border-success/20',
  REFUND: 'bg-primary/10 text-primary border-primary/20',
  WITHDRAWAL: 'bg-muted text-muted-foreground border-border',
  COMMISSION: 'bg-success/10 text-success border-success/20',
};

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium break-all">{value ?? '—'}</span>
    </div>
  );
}

/** Transaction detail: the transaction itself, who made it (mentee/mentor profile) and the linked booking. */
function TransactionDetail({ txn, user, onClose }: { txn: AdminTransaction; user?: UserProfile; onClose: () => void }) {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!txn.relatedBookingId) return;
    setBookingLoading(true);
    getBookingById(txn.relatedBookingId)
      .then(setBooking)
      .catch(() => setBooking(null))
      .finally(() => setBookingLoading(false));
  }, [txn.relatedBookingId]);

  const role = user?.roles?.includes('ADMIN') ? 'Admin'
    : user?.roles?.includes('MENTOR') ? 'Mentor'
    : (vi ? 'Học viên (Mentee)' : 'Mentee');

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>{vi ? 'Chi tiết giao dịch' : 'Transaction details'}</DialogTitle></DialogHeader>

        <section className="rounded-xl border border-border p-4">
          <h3 className="mb-2 text-sm font-semibold">{vi ? 'Giao dịch' : 'Transaction'}</h3>
          <DetailRow label={vi ? 'Mã giao dịch' : 'Transaction ID'} value={txn.id} />
          <DetailRow label={vi ? 'Loại' : 'Type'} value={<Badge className={`border ${typeColor[txn.type] ?? 'border-border'}`}>{txn.type}</Badge>} />
          <DetailRow label={vi ? 'Số tiền' : 'Amount'} value={formatCurrency(txn.amount)} />
          <DetailRow label={vi ? 'Trạng thái' : 'Status'} value={<StatusBadge status={txn.status} />} />
          <DetailRow label={vi ? 'Thời gian' : 'Time'} value={formatDateTime(txn.createdAt, lang)} />
          <DetailRow label={vi ? 'Mô tả' : 'Description'} value={txn.description} />
        </section>

        <section className="rounded-xl border border-border p-4">
          <h3 className="mb-2 text-sm font-semibold">{vi ? 'Người thực hiện' : 'User'}</h3>
          {user ? (
            <>
              <DetailRow label={vi ? 'Họ tên' : 'Name'} value={user.fullName} />
              <DetailRow label={vi ? 'Vai trò' : 'Role'} value={role} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label={vi ? 'Số điện thoại' : 'Phone'} value={user.phone} />
              <DetailRow label={vi ? 'Trường' : 'University'} value={user.universityName} />
              <DetailRow label={vi ? 'Ngành' : 'Major'} value={user.major} />
              <DetailRow label={vi ? 'MSSV' : 'Student ID'} value={user.studentId} />
              <DetailRow label={vi ? 'Số dư ví hiện tại' : 'Current wallet balance'} value={formatCurrency(user.walletBalance ?? 0)} />
              <DetailRow label={vi ? 'Tài khoản' : 'Account'} value={<StatusBadge status={user.status === 'ACTIVE' ? 'Active' : 'Suspended'} />} />
              <DetailRow label={vi ? 'Ngày tham gia' : 'Joined'} value={formatDate(user.createdAt, lang)} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {vi ? `Không tìm thấy người dùng (mã ${txn.userId}). Tài khoản có thể đã bị xoá.` : `User not found (ID ${txn.userId}). The account may have been deleted.`}
            </p>
          )}
        </section>

        {txn.relatedBookingId && (
          <section className="rounded-xl border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold">{vi ? 'Buổi học liên quan' : 'Related booking'}</h3>
            {bookingLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {vi ? 'Đang tải…' : 'Loading…'}</p>
            ) : booking ? (
              <>
                <DetailRow label={vi ? 'Mã buổi học' : 'Booking ID'} value={booking.id} />
                <DetailRow label={vi ? 'Môn học' : 'Course'} value={booking.courseCode} />
                <DetailRow label="Mentee" value={booking.menteeName} />
                <DetailRow label="Mentor" value={booking.mentorName} />
                <DetailRow label={vi ? 'Thời gian học' : 'Session time'} value={`${formatDateTime(booking.startAt, lang)} · ${booking.durationMin} ${vi ? 'phút' : 'min'}`} />
                <DetailRow label={vi ? 'Học phí' : 'Price'} value={formatCurrency(booking.price)} />
                <DetailRow label={vi ? 'Trạng thái' : 'Status'} value={<StatusBadge status={mapStatusToDisplay(booking.status)} />} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{vi ? `Không tải được buổi học ${txn.relatedBookingId}.` : `Could not load booking ${txn.relatedBookingId}.`}</p>
            )}
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AdminTransactions() {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [txns, setTxns] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [usersById, setUsersById] = useState<Record<string, UserProfile>>({});
  const [selected, setSelected] = useState<AdminTransaction | null>(null);

  useEffect(() => {
    listAdminTransactions()
      .then(setTxns)
      .catch(() => toast.error(vi ? 'Không tải được giao dịch.' : 'Failed to load transactions.'))
      .finally(() => setLoading(false));
    // Users are loaded once so "Chi tiết" opens instantly.
    listAdminUsers()
      .then((users) => setUsersById(Object.fromEntries(users.map((u) => [u.id, u]))))
      .catch(() => { /* details then show only the user id */ });
  }, []);

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      const q = query.toLowerCase();
      const matchQ = !q || t.id.toLowerCase().includes(q)
        || (t.userName ?? '').toLowerCase().includes(q)
        || (t.description ?? '').toLowerCase().includes(q);
      const matchT = typeFilter === 'All' || t.type === typeFilter;
      return matchQ && matchT;
    });
  }, [txns, query, typeFilter]);

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Giao dịch' : 'Transactions'}</h1>
        <p className="mt-1 text-muted-foreground">{vi ? 'Sổ cái đầy đủ mọi giao dịch ví trên nền tảng.' : 'Full ledger of all platform wallet transactions.'}</p>
      </div>

      <Card className="border-border p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={vi ? 'Tìm theo mã, người dùng hoặc mô tả' : 'Search by ID, user, or description'}
              className="bg-input-background pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{t === 'All' ? (vi ? 'Tất cả loại' : 'All types') : t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> {vi ? 'Đang tải giao dịch…' : 'Loading transactions…'}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filtered.length} {vi ? 'giao dịch' : 'transactions'}</p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{vi ? 'Người dùng' : 'User'}</TableHead>
                    <TableHead>{vi ? 'Loại' : 'Type'}</TableHead>
                    <TableHead>{vi ? 'Mô tả' : 'Description'}</TableHead>
                    <TableHead>{vi ? 'Ngày' : 'Date'}</TableHead>
                    <TableHead>{vi ? 'Số tiền' : 'Amount'}</TableHead>
                    <TableHead>{vi ? 'Trạng thái' : 'Status'}</TableHead>
                    <TableHead className="text-right">{vi ? 'Chi tiết' : 'Details'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell style={{ fontWeight: 500 }}>{t.userName ?? t.userId.slice(0, 8)}</TableCell>
                      <TableCell><Badge className={`border ${typeColor[t.type] ?? 'border-border'}`}>{t.type}</Badge></TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">{t.description}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(t.createdAt, lang, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelected(t)}>
                          <Eye className="size-3.5 mr-1" /> {vi ? 'Chi tiết' : 'Details'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>

      {selected && (
        <TransactionDetail txn={selected} user={usersById[selected.userId]} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
