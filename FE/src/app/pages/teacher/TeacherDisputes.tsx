import { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle2, RefreshCcw, MessageSquare } from 'lucide-react';
import { disputes } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
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

export function TeacherDisputes() {
  const [selected, setSelected] = useState<typeof disputes[0] | null>(null);

  const counts = {
    Open: disputes.filter((d) => d.status === 'Open').length,
    'Under Review': disputes.filter((d) => d.status === 'Under Review').length,
    Resolved: disputes.filter((d) => d.status === 'Resolved').length,
    Refunded: disputes.filter((d) => d.status === 'Refunded').length,
  };

  const respond = (e: React.FormEvent) => {
    e.preventDefault();
    setSelected(null);
    toast.success('Your response has been submitted to GRADORA.');
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Disputes</h1>
        <p className="mt-1 text-muted-foreground">
          Review student complaints and respond to open disputes.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open" value={String(counts.Open)} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Under Review" value={String(counts['Under Review'])} icon={Clock} />
        <KpiCard label="Resolved" value={String(counts.Resolved)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Refunded" value={String(counts.Refunded)} icon={RefreshCcw} tone="success" />
      </div>

      <Card className="border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Open disputes</h2>
        {disputes.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Student claim</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Issue type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell style={{ fontWeight: 500 }}>{d.id}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{d.reason}</TableCell>
                    <TableCell className="text-muted-foreground">{d.course}</TableCell>
                    <TableCell className="text-muted-foreground">{d.issueType}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(d.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={d.status === 'Open' ? 'default' : 'outline'}
                        onClick={() => setSelected(d)}
                      >
                        <MessageSquare className="size-4" />
                        {d.status === 'Open' ? 'Respond' : 'View'}
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
            title="No disputes"
            description="No student disputes have been raised against your sessions."
          />
        )}
      </Card>

      {/* Respond dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Respond to {selected.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Student's reason</p>
                <div className="rounded-xl border border-border bg-accent/50 p-3 text-sm">{selected.reason}</div>
              </div>
              {selected.adminNote && (
                <div className="rounded-xl bg-primary/10 p-3 text-sm text-primary">{selected.adminNote}</div>
              )}
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} />
              </div>
              {selected.status === 'Open' && (
                <form onSubmit={respond}>
                  <Label className="mb-1.5 block">Your response</Label>
                  <Textarea placeholder="Explain your side of the situation clearly..." rows={4} />
                  <DialogFooter className="mt-4 gap-3">
                    <Button type="button" variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                    <Button type="submit">Submit Response</Button>
                  </DialogFooter>
                </form>
              )}
              {selected.status !== 'Open' && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                </DialogFooter>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
