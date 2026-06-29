import { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle2, RefreshCcw, Plus, MessageSquare } from 'lucide-react';
import { disputes, sessions, formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { KpiCard } from '../../components/cards';
import { StatusBadge, EmptyState } from '../../components/common';
import { toast } from 'sonner';

const issueTypes = [
  'Session not attended',
  'Quality concern',
  'Refund request',
  'Technical issue',
  'Mentor misconduct',
  'Other',
];

export function DashboardDisputes() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<typeof disputes[0] | null>(null);

  const counts = {
    Open: disputes.filter((d) => d.status === 'Open').length,
    'Under Review': disputes.filter((d) => d.status === 'Under Review').length,
    Resolved: disputes.filter((d) => d.status === 'Resolved').length,
    Refunded: disputes.filter((d) => d.status === 'Refunded').length,
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    toast.success('Dispute submitted. GRADORA will review it within 48 hours.');
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Disputes &amp; Complaints</h1>
          <p className="mt-1 text-muted-foreground">
            Open and track support requests for sessions, refunds, or mentor issues.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Open New Dispute
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open" value={String(counts.Open)} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Under Review" value={String(counts['Under Review'])} icon={Clock} />
        <KpiCard label="Resolved" value={String(counts.Resolved)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Refunded" value={String(counts.Refunded)} icon={RefreshCcw} tone="success" />
      </div>

      <Card className="border-border p-6">
        <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>My disputes</h2>
        {disputes.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell style={{ fontWeight: 500 }}>{d.id}</TableCell>
                    <TableCell className="text-muted-foreground">{d.course}</TableCell>
                    <TableCell style={{ fontWeight: 500 }}>{d.mentor}</TableCell>
                    <TableCell className="text-muted-foreground">{d.issueType}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(d.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelected(d)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="No disputes yet"
            description="When something goes wrong, you can open a dispute and GRADORA will review it fairly."
            action={<Button onClick={() => setOpen(true)}>Open a Dispute</Button>}
          />
        )}
      </Card>

      {/* New dispute dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Open a new dispute</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <Label className="mb-1.5 block">Related session</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select a session" /></SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.mentorName} — {s.course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Issue type</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select issue type" /></SelectTrigger>
                <SelectContent>
                  {issueTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Describe the problem</Label>
              <Textarea placeholder="Please describe what happened in detail..." rows={4} />
            </div>
            <DialogFooter className="gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Submit Dispute</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dispute detail dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>{selected.id} — {selected.issueType}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={selected.status} />
                <span className="text-sm text-muted-foreground">
                  Opened {new Date(selected.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Your reason</p>
                <p className="mt-1">{selected.reason}</p>
              </div>
              {selected.adminNote && (
                <div className="flex items-start gap-2 rounded-xl bg-primary/10 p-4">
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm text-primary" style={{ fontWeight: 600 }}>Admin note</p>
                    <p className="text-sm text-muted-foreground">{selected.adminNote}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
