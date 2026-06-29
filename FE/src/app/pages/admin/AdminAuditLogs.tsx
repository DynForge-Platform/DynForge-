import { auditLogs } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { cn } from '../../components/ui/utils';

const statusColor: Record<string, string> = {
  Success: 'bg-success/10 text-success border-success/20',
  Warning: 'bg-warning/10 text-warning border-warning/20',
  Failed: 'bg-danger/10 text-danger border-danger/20',
};

export function AdminAuditLogs() {
  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Audit Logs</h1>
        <p className="mt-1 text-muted-foreground">Full history of admin actions on the platform.</p>
      </div>

      <Card className="border-border p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Log ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
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
                    {new Date(log.timestamp).toLocaleString('en-GB', {
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
