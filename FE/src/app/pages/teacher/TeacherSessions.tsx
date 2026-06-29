import { useState } from 'react';
import { Video, CheckCircle2, Eye, AlertTriangle } from 'lucide-react';
import { teacherSessions, formatCurrency, TeacherSession } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { StatusBadge, EmptyState } from '../../components/common';
import { MeetRoomOverlay } from '../../components/MeetRoomOverlay';
import { CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';

const tabs = ['All', 'Pending', 'Upcoming', 'Completed', 'Cancelled'];

const declineReasons = [
  'Schedule conflict',
  'Outside my expertise',
  'Unavailable at this time',
  'Student requested wrong course',
  'Other',
];

export function TeacherSessions() {
  const [tab, setTab] = useState('All');
  const filtered = tab === 'All' ? teacherSessions : teacherSessions.filter((s) => s.sessionStatus === tab);

  const [meetSession, setMeetSession] = useState<TeacherSession | null>(null);
  const [viewSession, setViewSession] = useState<TeacherSession | null>(null);
  const [acceptSession, setAcceptSession] = useState<TeacherSession | null>(null);
  const [declineSession, setDeclineSession] = useState<TeacherSession | null>(null);
  const [completeSession, setCompleteSession] = useState<TeacherSession | null>(null);
  const [disputeSession, setDisputeSession] = useState<TeacherSession | null>(null);

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Session with ${acceptSession?.studentName} accepted.`);
    setAcceptSession(null);
  };

  const handleDecline = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Session with ${declineSession?.studentName} declined.`);
    setDeclineSession(null);
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Session marked as completed. Escrow will be released to your wallet.`);
    setCompleteSession(null);
  };

  const handleDispute = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Your response has been submitted to GRADORA.');
    setDisputeSession(null);
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Sessions</h1>
        <p className="mt-1 text-muted-foreground">
          Manage student bookings — accept, join, and complete sessions.
        </p>
      </div>

      <Card className="border-border p-5">
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="flex-wrap">
            {tabs.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ImageWithFallback src={s.studentAvatar} alt={s.studentName} className="size-8 rounded-full object-cover" />
                        <span style={{ fontWeight: 500 }}>{s.studentName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.course}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(s.dateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      {' · '}
                      {new Date(s.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.durationMinutes} min</TableCell>
                    <TableCell className="text-muted-foreground">{s.format}</TableCell>
                    <TableCell><StatusBadge status={s.paymentStatus} /></TableCell>
                    <TableCell><StatusBadge status={s.sessionStatus} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {s.sessionStatus === 'Pending' && (
                          <>
                            <Button size="sm" variant="outline" className="text-danger border-danger/30" onClick={() => setDeclineSession(s)}>
                              Decline
                            </Button>
                            <Button size="sm" onClick={() => setAcceptSession(s)}>Accept</Button>
                          </>
                        )}
                        {s.sessionStatus === 'Upcoming' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setViewSession(s)}>
                              <Eye className="size-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setCompleteSession(s)}>
                              Mark done
                            </Button>
                            <Button size="sm" className="gap-1.5" onClick={() => setMeetSession(s)}>
                              <Video className="size-3.5" /> Join
                            </Button>
                          </>
                        )}
                        {s.sessionStatus === 'Completed' && (
                          <Button size="sm" variant="outline" onClick={() => setViewSession(s)}>
                            <Eye className="size-3.5" /> View
                          </Button>
                        )}
                        {s.sessionStatus === 'Cancelled' && (
                          <Button size="sm" variant="outline" className="text-warning border-warning/30" onClick={() => setDisputeSession(s)}>
                            <AlertTriangle className="size-3.5" /> Respond
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={CalendarCheck}
            title={`No ${tab.toLowerCase()} sessions`}
            description="Sessions from students will appear here once they book with you."
          />
        )}
      </Card>

      {/* ── Meet room ───────────────────────────────────────────── */}
      {meetSession && (
        <MeetRoomOverlay
          course={meetSession.course}
          partnerName={meetSession.studentName}
          partnerAvatar={meetSession.studentAvatar}
          partnerRole="Student"
          durationMinutes={meetSession.durationMinutes}
          onClose={() => setMeetSession(null)}
        />
      )}

      {/* ── View session detail ──────────────────────────────────── */}
      {viewSession && (
        <Dialog open onOpenChange={() => setViewSession(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader><DialogTitle>Session details</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ImageWithFallback src={viewSession.studentAvatar} alt={viewSession.studentName} className="size-12 rounded-xl object-cover" />
                <div>
                  <p style={{ fontWeight: 600 }}>{viewSession.studentName}</p>
                  <p className="text-sm text-muted-foreground">{viewSession.course}</p>
                </div>
                <div className="ml-auto"><StatusBadge status={viewSession.sessionStatus} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Date', new Date(viewSession.dateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
                  ['Time', new Date(viewSession.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })],
                  ['Duration', `${viewSession.durationMinutes} min`],
                  ['Format', viewSession.format],
                  ['Mode', viewSession.mode],
                  ['Amount', formatCurrency(viewSession.amount)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border p-3">
                    <p className="text-muted-foreground">{label}</p>
                    <p style={{ fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewSession(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Accept modal ─────────────────────────────────────────── */}
      {acceptSession && (
        <Dialog open onOpenChange={() => setAcceptSession(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="size-5" /> Accept booking request
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAccept} className="space-y-4">
              <div className="rounded-xl border border-border p-4 space-y-1">
                <div className="flex items-center gap-3">
                  <ImageWithFallback src={acceptSession.studentAvatar} alt={acceptSession.studentName} className="size-12 rounded-xl object-cover" />
                  <div>
                    <p style={{ fontWeight: 600 }}>{acceptSession.studentName}</p>
                    <p className="text-sm text-muted-foreground">{acceptSession.course}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(acceptSession.dateTime).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}
                      {' · '}
                      {new Date(acceptSession.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{acceptSession.durationMinutes} min
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                By accepting, you confirm you will be available at this time. The student will be notified and the session will move to Upcoming.
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setAcceptSession(null)}>Cancel</Button>
                <Button type="submit" className="bg-success hover:bg-success/90">Confirm acceptance</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Decline modal ─────────────────────────────────────────── */}
      {declineSession && (
        <Dialog open onOpenChange={() => setDeclineSession(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader><DialogTitle>Decline booking request</DialogTitle></DialogHeader>
            <form onSubmit={handleDecline} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-accent/40 p-4">
                <ImageWithFallback src={declineSession.studentAvatar} alt={declineSession.studentName} className="size-12 rounded-xl object-cover" />
                <div>
                  <p style={{ fontWeight: 600 }}>{declineSession.studentName}</p>
                  <p className="text-sm text-muted-foreground">{declineSession.course} · {declineSession.durationMinutes} min</p>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Reason for declining</Label>
                <Select>
                  <SelectTrigger className="bg-input-background"><SelectValue placeholder="Select a reason" /></SelectTrigger>
                  <SelectContent>
                    {declineReasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Message to student <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea placeholder="Let the student know why and suggest alternatives..." rows={3} />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDeclineSession(null)}>Cancel</Button>
                <Button type="submit" variant="destructive">Decline request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Mark completed modal ──────────────────────────────────── */}
      {completeSession && (
        <Dialog open onOpenChange={() => setCompleteSession(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-success" /> Mark session as completed
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleComplete} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                <ImageWithFallback src={completeSession.studentAvatar} alt={completeSession.studentName} className="size-12 rounded-xl object-cover" />
                <div>
                  <p style={{ fontWeight: 600 }}>{completeSession.studentName}</p>
                  <p className="text-sm text-muted-foreground">{completeSession.course} · {completeSession.durationMinutes} min</p>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Session notes <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea placeholder="Add notes about what was covered, homework given, or follow-up..." rows={3} />
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                Marking as completed will trigger escrow release. {formatCurrency(Math.round(completeSession.amount * 0.85))} will be credited to your wallet within 24 hours.
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setCompleteSession(null)}>Cancel</Button>
                <Button type="submit">Confirm completion</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Respond to dispute modal ──────────────────────────────── */}
      {disputeSession && (
        <Dialog open onOpenChange={() => setDisputeSession(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-warning" /> Respond to dispute
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDispute} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-accent/40 p-4">
                <ImageWithFallback src={disputeSession.studentAvatar} alt={disputeSession.studentName} className="size-12 rounded-xl object-cover" />
                <div>
                  <p style={{ fontWeight: 600 }}>{disputeSession.studentName}</p>
                  <p className="text-sm text-muted-foreground">{disputeSession.course}</p>
                  <StatusBadge status={disputeSession.sessionStatus} />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Your response</Label>
                <Textarea placeholder="Explain your side of the situation clearly and factually. GRADORA will review both sides fairly." rows={4} required />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDisputeSession(null)}>Cancel</Button>
                <Button type="submit">Submit response</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
