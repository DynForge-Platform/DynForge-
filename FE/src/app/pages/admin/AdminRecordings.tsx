import { useState, useEffect } from 'react';
import { Video, Download, Play, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { EmptyState } from '../../components/common';
import { toast } from 'sonner';
import { listRecordings, downloadRecording, type Recording } from '../../services/recordingService';

function fmtSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminRecordings() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    listRecordings()
      .then(setRecordings)
      .catch(() => toast.error('Failed to load recordings.'))
      .finally(() => setLoading(false));
  }, []);

  const withBlob = async (id: string, fn: (url: string) => void) => {
    setBusyId(id);
    try {
      const blob = await downloadRecording(id);
      const url = URL.createObjectURL(blob);
      fn(url);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not load recording.');
    } finally {
      setBusyId(null);
    }
  };

  const play = (id: string) => withBlob(id, (url) => window.open(url, '_blank'));
  const download = (id: string) => withBlob(id, (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${id}.webm`;
    a.click();
  });

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Session Recordings</h1>
        <p className="mt-1 text-muted-foreground">
          Recorded sessions kept as evidence for dispute resolution.
        </p>
      </div>

      <Card className="border-border p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading recordings…
          </div>
        ) : recordings.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Uploaded by</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Recorded</TableHead>
                  <TableHead className="text-right">Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordings.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell style={{ fontWeight: 500 }}>{r.courseCode}</TableCell>
                    <TableCell className="text-muted-foreground">{r.bookingId.slice(0, 8)}…</TableCell>
                    <TableCell className="text-muted-foreground">{r.uploaderName ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtSize(r.size)}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => play(r.id)}>
                          {busyId === r.id ? <Loader2 className="size-4 animate-spin" /> : <><Play className="size-3.5" /> Play</>}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-primary" disabled={busyId === r.id} onClick={() => download(r.id)}>
                          <Download className="size-3.5" /> Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={Video}
            title="No recordings yet"
            description="Recorded sessions will appear here for dispute review."
          />
        )}
      </Card>
    </div>
  );
}
