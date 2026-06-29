import { useState } from 'react';
import { Search } from 'lucide-react';
import { mentors, formatCurrency } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { StarRating, StatusBadge, VerifiedBadge } from '../../components/common';
import { toast } from 'sonner';

export function AdminMentors() {
  const [query, setQuery] = useState('');
  const filtered = mentors.filter((m) => {
    const q = query.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.university.toLowerCase().includes(q) || m.major.toLowerCase().includes(q);
  });

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Mentor Management</h1>
        <p className="mt-1 text-muted-foreground">View and manage all registered mentors.</p>
      </div>

      <Card className="border-border p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search mentors"
              className="bg-input-background pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Major</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ImageWithFallback src={m.avatar} alt={m.name} className="size-9 rounded-xl object-cover" />
                      <div>
                        <p style={{ fontWeight: 500 }}>{m.name}</p>
                        <p className="text-sm text-muted-foreground">{m.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{m.university}</TableCell>
                  <TableCell className="text-muted-foreground">{m.major}</TableCell>
                  <TableCell><VerifiedBadge verified={m.verified} /></TableCell>
                  <TableCell><StarRating rating={m.rating} /></TableCell>
                  <TableCell className="text-muted-foreground">{m.sessionsCompleted}</TableCell>
                  <TableCell style={{ fontWeight: 500 }}>{formatCurrency(m.hourlyRate)}/hr</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-danger border-danger/30"
                        onClick={() => toast.success(`${m.name} suspended.`)}
                      >
                        Suspend
                      </Button>
                    </div>
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
