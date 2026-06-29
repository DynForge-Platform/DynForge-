import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { disputes, formatCurrency, sessions } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { KpiCard } from '../../components/cards';
import { StatusBadge, EmptyState } from '../../components/common';
import { toast } from 'sonner';

function priorityColor(status: string) {
  if (status === 'Open') return 'bg-danger/10 text-danger border-danger/20';
  if (status === 'Under Review') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-muted text-muted-foreground';
}

function priority(status: string) {
  if (status === 'Open') return 'High';
  if (status === 'Under Review') return 'Medium';
  return 'Low';
}

export function AdminDisputes() {
  const [selected, setSelected] = useState<typeof disputes[0] | null>(null);

  const counts = {
    Open: disputes.filter((d) => d.status === 'Open').length,
    'Under Review': disputes.filter((d) => d.status === 'Under Review').length,
    Resolved: disputes.filter((d) => d.status === 'Resolved').length,
    Refunded: disputes.filter((d) => d.status === 'Refunded').length,
  };

  const decide = (verdict: string) => {
    if (!selected) return;
    toast.success(`${selected.id} marked as ${verdict}.`);
    setSelected(null);
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Dispute Management</h1>
        <p className="mt-1 text-muted-foreground">Review and resolve student–mentor disputes fairly.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open" value={String(counts.Open)} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Under Review" value={String(counts['Under Review'])} icon={AlertTriangle} />
        <KpiCard label="Resolved" value={String(counts.Resolved)} icon={AlertTriangle} tone="success" />
        <KpiCard label="Refunded" value={String(counts.Refunded)} icon={AlertTriangle} tone="success" />
      </div>

      <Card className="border-border p-6">
        {disputes.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => {
                  const session = sessions.find((s) => s.id === d.sessionId);
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Badge className={`border ${priorityColor(d.status)}`}>{priority(d.status)}</Badge>
                      </TableCell>
                      <TableCell style={{ fontWeight: 500 }}>{d.id}</TableCell>
                      <TableCell className="text-muted-foreground">Trang Do</TableCell>
                      <TableCell className="text-muted-foreground">{d.mentor}</TableCell>
                      <TableCell className="text-muted-foreground">{d.course}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">{d.issueType}</TableCell>
                      <TableCell><StatusBadge status={d.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelected(d)}>Review</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="No disputes"
            description="All disputes have been resolved."
          />
        )}
      </Card>

      {/* Admin decision dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Admin review — {selected.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Mentor</p>
                  <p style={{ fontWeight: 500 }}>{selected.mentor}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground">Issue type</p>
                  <p style={{ fontWeight: 500 }}>{selected.issueType}</p>
                </div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-muted-foreground mb-1">Student's reason</p>
                <p>{selected.reason}</p>
              </div>
              {selected.adminNote && (
                <div className="rounded-xl bg-primary/10 p-3">
                  <p className="text-primary" style={{ fontWeight: 500 }}>Previous admin note</p>
                  <p className="text-muted-foreground">{selected.adminNote}</p>
                </div>
              )}
              <div>
                <Label className="mb-1.5 block">Decision note</Label>
                <Textarea placeholder="Write your decision / resolution note..." rows={3} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="destructive" onClick={() => decide('Rejected')}>Reject claim</Button>
              <Button variant="outline" onClick={() => decide('Refunded')} className="text-success border-success/30">
                Issue refund
              </Button>
              <Button onClick={() => decide('Resolved')}>Mark resolved</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
