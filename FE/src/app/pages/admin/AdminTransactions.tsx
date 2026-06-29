import { useState } from 'react';
import { Search } from 'lucide-react';
import { transactions, walletTransactions, formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { StatusBadge } from '../../components/common';

export function AdminTransactions() {
  const [query, setQuery] = useState('');

  const filtered = transactions.filter((t) => {
    const q = query.toLowerCase();
    return !q || t.id.toLowerCase().includes(q) || t.student.toLowerCase().includes(q) || t.mentor.toLowerCase().includes(q);
  });

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Transactions</h1>
        <p className="mt-1 text-muted-foreground">Full ledger of all platform transactions.</p>
      </div>

      <Card className="border-border p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, student, or mentor"
              className="bg-input-background pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Platform fee</TableHead>
                <TableHead>Escrow status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell style={{ fontWeight: 500 }}>{t.id}</TableCell>
                  <TableCell className="text-muted-foreground">{t.student}</TableCell>
                  <TableCell className="text-muted-foreground">{t.mentor}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(t.commission)}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-primary">Receipt</Button>
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
