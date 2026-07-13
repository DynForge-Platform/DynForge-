import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { StatusBadge } from '../../components/common';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listVerifications,
  decideVerification,
  type VerificationItem,
} from '../../services/verificationService';

export function AdminVerification() {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VerificationItem | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    listVerifications()
      .then(setItems)
      .catch(() => toast.error('Failed to load verification requests.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDecide = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selected) return;
    if (status === 'REJECTED' && !rejectNote.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setDeciding(true);
    try {
      const updated = await decideVerification(selected.id, status, rejectNote.trim() || undefined);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast.success(status === 'APPROVED'
        ? `${selected.userName ?? 'Mentor'} approved successfully.`
        : `${selected.userName ?? 'Mentor'}'s application rejected.`);
      setSelected(null);
      setRejectNote('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Action failed. Please try again.');
    } finally {
      setDeciding(false);
    }
  };

  const statusLabel = (s: string) => {
    if (s === 'APPROVED') return 'Approved';
    if (s === 'REJECTED') return 'Rejected';
    return 'Pending';
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Mentor Verification</h1>
        <p className="mt-1 text-muted-foreground">Review and approve mentor applications.</p>
      </div>

      <Card className="border-border p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading applications…
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No verification requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Transcript</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ImageWithFallback
                          src={item.avatarUrl ?? ''}
                          alt={item.userName ?? item.userId}
                          className="size-9 rounded-xl object-cover"
                        />
                        <div>
                          <p style={{ fontWeight: 500 }}>{item.userName ?? item.userId}</p>
                          <p className="text-xs text-muted-foreground">{item.userId.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell style={{ fontWeight: 500 }}>{item.course}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary" style={{ fontWeight: 600 }}>
                        {item.claimedGrade}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.transcriptUrl
                        ? <span className="text-primary underline cursor-pointer">{item.transcriptUrl}</span>
                        : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell><StatusBadge status={statusLabel(item.status)} /></TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelected(item); setRejectNote(item.note ?? ''); }}
                        disabled={item.status !== 'PENDING'}
                      >
                        {item.status === 'PENDING' ? 'Review' : 'Reviewed'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {selected && (
        <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setRejectNote(''); }}>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Review: {selected.userName ?? selected.userId}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ImageWithFallback
                  src={selected.avatarUrl ?? ''}
                  alt={selected.userName ?? ''}
                  className="size-14 rounded-xl object-cover"
                />
                <div>
                  <p style={{ fontWeight: 600 }}>{selected.userName ?? selected.userId}</p>
                  <p className="text-sm text-muted-foreground">Applied for: <strong>{selected.course}</strong></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Claimed grade</p>
                  <p style={{ fontWeight: 600 }}>{selected.claimedGrade}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Transcript</p>
                  <p style={{ fontWeight: 500 }} className="truncate">{selected.transcriptUrl ?? '—'}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Rejection note (required when rejecting)</Label>
                <Textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Explain why the application is rejected…"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="destructive" onClick={() => handleDecide('REJECTED')} disabled={deciding}>
                {deciding ? <Loader2 className="size-4 animate-spin" /> : 'Reject'}
              </Button>
              <Button onClick={() => handleDecide('APPROVED')} disabled={deciding}>
                {deciding ? <Loader2 className="size-4 animate-spin" /> : 'Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
