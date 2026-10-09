import { auditLogs } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { cn } from '../../components/ui/utils';
import { useLanguage } from '../../context/LanguageContext';
import { formatDateTime } from '../../lib/format';

const statusColor: Record<string, string> = {
  Success: 'bg-success/10 text-success border-success/20',
  Warning: 'bg-warning/10 text-warning border-warning/20',
  Failed: 'bg-danger/10 text-danger border-danger/20',
};

export function AdminAuditLogs() {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Nhật ký kiểm toán' : 'Audit Logs'}</h1>
        <p className="mt-1 text-muted-foreground">{vi ? 'Toàn bộ lịch sử thao tác của admin trên nền tảng.' : 'Full history of admin actions on the platform.'}</p>
      </div>

      <Card className="border-border p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{vi ? 'Mã nhật ký' : 'Log ID'}</TableHead>
                <TableHead>{vi ? 'Hành động' : 'Action'}</TableHead>
                <TableHead>{vi ? 'Người thực hiện' : 'Actor'}</TableHead>
                <TableHead>{vi ? 'Đối tượng' : 'Target'}</TableHead>
                <TableHead>{vi ? 'Thời gian' : 'Timestamp'}</TableHead>
                <TableHead>{vi ? 'Trạng thái' : 'Status'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">{log.id}</TableCell>
                  <TableCell style={{ fontWeight: 500 }}>{log.action}</TableCell>
                  <TableCell className="text-muted-foreground">{log.actor}</TableCell>
                  <TableCell className="text-muted-foreground">{log.target}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.timestamp, lang, {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('border', statusColor[log.status])}>{log.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
