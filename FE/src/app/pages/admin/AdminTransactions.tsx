import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { StatusBadge } from '../../components/common';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { listAdminTransactions, type AdminTransaction } from '../../services/adminService';

const TYPES = ['All', 'TOPUP', 'PAYMENT', 'PAYOUT', 'REFUND', 'WITHDRAWAL', 'COMMISSION'];

const typeColor: Record<string, string> = {
  TOPUP: 'bg-primary/10 text-primary border-primary/20',
  PAYMENT: 'bg-warning/10 text-warning border-warning/20',
  PAYOUT: 'bg-success/10 text-success border-success/20',
  REFUND: 'bg-primary/10 text-primary border-primary/20',
  WITHDRAWAL: 'bg-muted text-muted-foreground border-border',
  COMMISSION: 'bg-success/10 text-success border-success/20',
};

export function AdminTransactions() {
  const [txns, setTxns] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    listAdminTransactions()
      .then(setTxns)
      .catch(() => toast.error('Failed to load transactions.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      const q = query.toLowerCase();
      const matchQ = !q || t.id.toLowerCase().includes(q)
        || (t.userName ?? '').toLowerCase().includes(q)
        || (t.description ?? '').toLowerCase().includes(q);
      const matchT = typeFilter === 'All' || t.type === typeFilter;
      return matchQ && matchT;
    });
  }, [txns, query, typeFilter]);

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Transactions</h1>
        <p className="mt-1 text-muted-foreground">Full ledger of all platform wallet transactions.</p>
      </div>

      <Card className="border-border p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, user, or description"
              className="bg-input-background pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{t === 'All' ? 'All types' : t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading transactions…
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filtered.length} transactions</p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell style={{ fontWeight: 500 }}>{t.userName ?? t.userId.slice(0, 8)}</TableCell>
                      <TableCell><Badge className={`border ${typeColor[t.type] ?? 'border-border'}`}>{t.type}</Badge></TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">{t.description}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
