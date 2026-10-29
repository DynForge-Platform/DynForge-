import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { formatCurrency, type Mentor } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { StarRating, VerifiedBadge, StatusBadge } from '../../components/common';
import { toast } from 'sonner';
import { backendToMentor, type MentorProfileResponse } from '../../services/mentorService';
import { listAdminMentors, updateUserStatus } from '../../services/adminService';
import { useLanguage } from '../../context/LanguageContext';

interface AdminMentorRow extends Mentor {
  userId: string;
  suspended: boolean;
}

const toRow = (p: MentorProfileResponse): AdminMentorRow => ({
  ...backendToMentor(p),
  userId: p.userId,
  suspended: p.accountStatus === 'SUSPENDED',
});

export function AdminMentors() {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [rows, setRows] = useState<AdminMentorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    listAdminMentors()
      .then((profiles) => setRows(profiles.map(toRow)))
      .catch(() => toast.error(vi ? 'Không tải được danh sách mentor.' : 'Failed to load mentors.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => rows.filter((m) => {
    const q = query.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.university.toLowerCase().includes(q) || m.major.toLowerCase().includes(q);
  }), [rows, query]);

  // Suspend hides the mentor from mentees (listing, profile, booking) and blocks their login; unlock restores it.
  const toggleSuspend = async (m: AdminMentorRow) => {
    const next = m.suspended ? 'ACTIVE' : 'SUSPENDED';
    setActingId(m.userId);
    try {
      await updateUserStatus(m.userId, next);
      setRows((prev) => prev.map((r) => (r.userId === m.userId ? { ...r, suspended: next === 'SUSPENDED' } : r)));
      toast.success(next === 'SUSPENDED'
        ? (vi ? `Đã tạm khoá ${m.name}. Mentor này không còn hiện với học viên.` : `${m.name} suspended and hidden from mentees.`)
        : (vi ? `Đã mở khoá ${m.name}.` : `${m.name} reactivated.`));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Không thể cập nhật trạng thái mentor.' : 'Could not update mentor status.'));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Quản lý Mentor' : 'Mentor Management'}</h1>
        <p className="mt-1 text-muted-foreground">{vi ? 'Xem và quản lý tất cả mentor đã đăng ký.' : 'View and manage all registered mentors.'}</p>
      </div>

      <Card className="border-border p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={vi ? 'Tìm mentor' : 'Search mentors'}
              className="bg-input-background pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> {vi ? 'Đang tải mentor…' : 'Loading mentors…'}
          </div>
        ) : filtered.length ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filtered.length} mentor</p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>{vi ? 'Ngành' : 'Major'}</TableHead>
                    <TableHead>{vi ? 'Xác minh' : 'Verification'}</TableHead>
                    <TableHead>{vi ? 'Đánh giá' : 'Rating'}</TableHead>
                    <TableHead>{vi ? 'Buổi học' : 'Sessions'}</TableHead>
                    <TableHead>{vi ? 'Học phí' : 'Rate'}</TableHead>
                    <TableHead>{vi ? 'Trạng thái' : 'Status'}</TableHead>
                    <TableHead className="text-right">{vi ? 'Thao tác' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ImageWithFallback src={m.avatar} alt={m.name} className="size-9 rounded-xl object-cover" />
                          <div>
                            <p style={{ fontWeight: 500 }}>{m.name}</p>
                            <p className="text-sm text-muted-foreground">{m.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.major || '—'}</TableCell>
                      <TableCell><VerifiedBadge verified={m.verified} /></TableCell>
                      <TableCell><StarRating rating={m.rating} /></TableCell>
                      <TableCell className="text-muted-foreground">{m.sessionsCompleted}</TableCell>
                      <TableCell style={{ fontWeight: 500 }}>{m.hourlyRate ? `${formatCurrency(m.hourlyRate)}/${vi ? 'giờ' : 'hr'}` : '—'}</TableCell>
                      <TableCell><StatusBadge status={m.suspended ? 'Suspended' : 'Active'} /></TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className={m.suspended ? 'text-success border-success/30' : 'text-danger border-danger/30'}
                          disabled={actingId === m.userId}
                          onClick={() => toggleSuspend(m)}
                        >
                          {actingId === m.userId
                            ? <Loader2 className="size-3.5 animate-spin" />
                            : m.suspended ? (vi ? 'Mở khoá' : 'Unlock') : (vi ? 'Tạm khoá' : 'Suspend')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <p className="py-12 text-center text-muted-foreground">{vi ? 'Không tìm thấy mentor nào.' : 'No mentors found.'}</p>
        )}
      </Card>
    </div>
  );
}
