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
import { useLanguage } from '../../context/LanguageContext';
import { formatDateTime } from '../../lib/format';

function fmtSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminRecordings() {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    listRecordings()
      .then(setRecordings)
      .catch(() => toast.error(vi ? 'Không tải được bản ghi.' : 'Failed to load recordings.'))
      .finally(() => setLoading(false));
  }, []);

  const withBlob = async (id: string, fn: (url: string) => void) => {
    setBusyId(id);
    try {
      const blob = await downloadRecording(id);
      const url = URL.createObjectURL(blob);
      fn(url);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Không tải được bản ghi.' : 'Could not load recording.'));
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
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Bản ghi buổi học' : 'Session Recordings'}</h1>
        <p className="mt-1 text-muted-foreground">
          {vi ? 'Các buổi học được ghi lại làm bằng chứng để giải quyết tranh chấp.' : 'Recorded sessions kept as evidence for dispute resolution.'}
        </p>
      </div>

      <Card className="border-border p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> {vi ? 'Đang tải bản ghi…' : 'Loading recordings…'}
          </div>
        ) : recordings.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{vi ? 'Môn học' : 'Course'}</TableHead>
                  <TableHead>{vi ? 'Lịch đặt' : 'Booking'}</TableHead>
                  <TableHead>{vi ? 'Người tải lên' : 'Uploaded by'}</TableHead>
                  <TableHead>{vi ? 'Dung lượng' : 'Size'}</TableHead>
                  <TableHead>{vi ? 'Ghi lúc' : 'Recorded'}</TableHead>
                  <TableHead className="text-right">{vi ? 'Bằng chứng' : 'Evidence'}</TableHead>
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
                      {formatDateTime(r.createdAt, lang, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => play(r.id)}>
                          {busyId === r.id ? <Loader2 className="size-4 animate-spin" /> : <><Play className="size-3.5" /> {vi ? 'Phát' : 'Play'}</>}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-primary" disabled={busyId === r.id} onClick={() => download(r.id)}>
                          <Download className="size-3.5" /> {vi ? 'Tải xuống' : 'Download'}
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
            title={vi ? 'Chưa có bản ghi' : 'No recordings yet'}
            description={vi ? 'Các buổi học được ghi lại sẽ hiển thị ở đây để xem xét tranh chấp.' : 'Recorded sessions will appear here for dispute review.'}
          />
        )}
      </Card>
    </div>
  );
}
