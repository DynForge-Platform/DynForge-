import { useState } from 'react';
import { mentors } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { VerifiedBadge, StatusBadge } from '../../components/common';
import { toast } from 'sonner';

const apps = mentors.map((m, i) => ({
  ...m,
  submitted: `2026-06-${String(10 + i).padStart(2, '0')}`,
  interviewStatus: i < 3 ? 'Completed' : i === 3 ? 'Scheduled' : 'Pending',
  docs: ['Transcript', 'University ID'],
}));

export function AdminVerification() {
  const [selected, setSelected] = useState<typeof apps[0] | null>(null);

  const approve = () => {
    if (!selected) return;
    toast.success(`${selected.name} approved as a verified mentor.`);
    setSelected(null);
  };
  const reject = () => {
    if (!selected) return;
    toast.error(`${selected.name}'s application rejected.`);
    setSelected(null);
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Mentor Verification</h1>
        <p className="mt-1 text-muted-foreground">Review and approve mentor applications.</p>
      </div>

      <Card className="border-border p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Interview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ImageWithFallback src={a.avatar} alt={a.name} className="size-9 rounded-xl object-cover" />
                      <div>
                        <p style={{ fontWeight: 500 }}>{a.name}</p>
                        <p className="text-sm text-muted-foreground">{a.major}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{a.university}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(a.submitted).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{a.docs.join(', ')}</span>
                  </TableCell>
                  <TableCell><StatusBadge status={a.interviewStatus} /></TableCell>
                  <TableCell><VerifiedBadge verified={a.verified} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(a)}>Review</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Review: {selected.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ImageWithFallback src={selected.avatar} alt={selected.name} className="size-14 rounded-xl object-cover" />
                <div>
                  <p style={{ fontWeight: 600 }}>{selected.name}</p>
                  <p className="text-sm text-muted-foreground">{selected.role} · {selected.university}</p>
                  <p className="text-sm text-muted-foreground">{selected.major}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Courses</p>
                  <p style={{ fontWeight: 500 }}>{selected.courses.map((c) => c.code).join(', ')}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Interview</p>
                  <StatusBadge status={selected.interviewStatus} />
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Submitted documents</p>
                <div className="flex flex-wrap gap-2">
                  {selected.docs.map((d) => (
                    <Button key={d} variant="outline" size="sm">{d}</Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button variant="destructive" onClick={reject}>Reject</Button>
              <Button variant="outline" onClick={() => { toast.info('More info requested.'); setSelected(null); }}>
                Request more info
              </Button>
              <Button onClick={approve} disabled={selected.verified}>
                {selected.verified ? 'Already approved' : 'Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
