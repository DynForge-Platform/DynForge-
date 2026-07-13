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
import { StarRating, VerifiedBadge } from '../../components/common';
import { toast } from 'sonner';
import { backendToMentor } from '../../services/mentorService';
import { listAdminMentors, updateUserStatus } from '../../services/adminService';

interface AdminMentorRow extends Mentor {
  userId: string;
}

export function AdminMentors() {
  const [rows, setRows] = useState<AdminMentorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    listAdminMentors()
      .then((profiles) => setRows(profiles.map((p) => ({ ...backendToMentor(p), userId: p.userId }))))
      .catch(() => toast.error('Failed to load mentors.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => rows.filter((m) => {
    const q = query.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.university.toLowerCase().includes(q) || m.major.toLowerCase().includes(q);
  }), [rows, query]);

  const suspend = async (m: AdminMentorRow) => {
    setActingId(m.userId);
    try {
      await updateUserStatus(m.userId, 'SUSPENDED');
      toast.success(`${m.name} suspended.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not suspend mentor.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Mentor Management</h1>
        <p className="mt-1 text-muted-foreground">View and manage all registered mentors.</p>
      </div>

      <Card className="border-border p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search mentors"
              className="bg-input-background pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading mentors…
          </div>
        ) : filtered.length ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filtered.length} mentors</p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Major</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell style={{ fontWeight: 500 }}>{m.hourlyRate ? `${formatCurrency(m.hourlyRate)}/hr` : '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger border-danger/30"
                          disabled={actingId === m.userId}
                          onClick={() => suspend(m)}
                        >
                          {actingId === m.userId ? <Loader2 className="size-3.5 animate-spin" /> : 'Suspend'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <p className="py-12 text-center text-muted-foreground">No mentors found.</p>
        )}
      </Card>
    </div>
  );
}
