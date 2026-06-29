import { useState } from 'react';
import { Plus, Tag, Copy, CheckCircle2, Trash2, Search } from 'lucide-react';
import { formatCurrency, mentors } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';

type VoucherType = 'percentage' | 'fixed';
type VoucherScope = 'platform' | 'mentor';
type VoucherStatus = 'Active' | 'Expired' | 'Disabled';

interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  minOrder: number;
  scope: VoucherScope;
  mentorName?: string;
  usageLimit: number;
  usedCount: number;
  expiry: string;
  status: VoucherStatus;
  createdBy: string;
}

const seedVouchers: Voucher[] = [
  { id: 'v1', code: 'GRADORA20', type: 'percentage', value: 20, minOrder: 100000, scope: 'platform', usageLimit: 500, usedCount: 143, expiry: '2026-07-31', status: 'Active', createdBy: 'Admin' },
  { id: 'v2', code: 'WELCOME50K', type: 'fixed', value: 50000, minOrder: 80000, scope: 'platform', usageLimit: 200, usedCount: 200, expiry: '2026-06-30', status: 'Expired', createdBy: 'Admin' },
  { id: 'v3', code: 'LINH15', type: 'percentage', value: 15, minOrder: 90000, scope: 'mentor', mentorName: 'Nguyễn Thị Linh', usageLimit: 50, usedCount: 12, expiry: '2026-08-15', status: 'Active', createdBy: 'Mentor' },
  { id: 'v4', code: 'GROUPDEAL', type: 'fixed', value: 30000, minOrder: 55000, scope: 'platform', usageLimit: 300, usedCount: 89, expiry: '2026-09-01', status: 'Active', createdBy: 'Admin' },
];

const statusColor: Record<VoucherStatus, string> = {
  Active: 'bg-success/10 text-success border-success/20',
  Expired: 'bg-muted text-muted-foreground',
  Disabled: 'bg-danger/10 text-danger border-danger/20',
};

function VoucherFormDialog({
  open,
  onClose,
  createdBy = 'Admin',
  mentorLock,
}: {
  open: boolean;
  onClose: () => void;
  createdBy?: string;
  mentorLock?: string;
}) {
  const [type, setType] = useState<VoucherType>('percentage');
  const [scope, setScope] = useState<VoucherScope>(mentorLock ? 'mentor' : 'platform');
  const [autoCode, setAutoCode] = useState(true);
  const [code, setCode] = useState('');

  const generate = () => {
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    setCode(`GRD${rand}`);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Voucher ${code || 'created'} is now active!`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="size-5 text-primary" />
            {mentorLock ? 'Create mentor voucher' : 'Create new voucher'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {/* Code */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>Voucher code</Label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <Switch checked={autoCode} onCheckedChange={(v) => { setAutoCode(v); if (v) generate(); }} />
                Auto-generate
              </label>
            </div>
            <div className="flex gap-2">
              <Input
                value={autoCode ? code : code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                readOnly={autoCode}
                placeholder="e.g. SUMMER30"
                className="bg-input-background font-mono tracking-widest uppercase"
                required
              />
              {autoCode && (
                <Button type="button" variant="outline" size="icon" onClick={generate}>
                  <Tag className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Discount type</Label>
              <Select value={type} onValueChange={(v) => setType(v as VoucherType)}>
                <SelectTrigger className="bg-input-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed amount (₫)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Discount value</Label>
              <div className="relative">
                <Input type="number" placeholder={type === 'percentage' ? '20' : '50000'} className="bg-input-background pr-10" required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {type === 'percentage' ? '%' : '₫'}
                </span>
              </div>
            </div>
          </div>

          {/* Min order + Usage limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Min. order (₫)</Label>
              <Input type="number" placeholder="80000" className="bg-input-background" />
            </div>
            <div>
              <Label className="mb-1.5 block">Usage limit</Label>
              <Input type="number" placeholder="100" className="bg-input-background" required />
            </div>
          </div>

          {/* Scope */}
          {!mentorLock && (
            <div>
              <Label className="mb-1.5 block">Applies to</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as VoucherScope)}>
                <SelectTrigger className="bg-input-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">All sessions (platform-wide)</SelectItem>
                  <SelectItem value="mentor">Specific mentor only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(scope === 'mentor' || mentorLock) && (
            <div>
              <Label className="mb-1.5 block">Mentor</Label>
              {mentorLock ? (
                <Input value={mentorLock} readOnly className="bg-input-background" />
              ) : (
                <Select>
                  <SelectTrigger className="bg-input-background"><SelectValue placeholder="Select mentor" /></SelectTrigger>
                  <SelectContent>
                    {mentors.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Expiry */}
          <div>
            <Label className="mb-1.5 block">Expiry date</Label>
            <Input type="date" className="bg-input-background" defaultValue="2026-08-31" required />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit"><Plus className="size-4" /> Create voucher</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>(seedVouchers);
  const [showCreate, setShowCreate] = useState(false);
  const [tabFilter, setTabFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    toast.success(`Copied "${code}"`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const remove = (id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    toast.success('Voucher removed.');
  };

  const filtered = vouchers.filter((v) => {
    const matchTab = tabFilter === 'All' || v.status === tabFilter;
    const matchQ = !query || v.code.toLowerCase().includes(query.toLowerCase());
    return matchTab && matchQ;
  });

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Vouchers</h1>
          <p className="mt-1 text-muted-foreground">Create and manage discount vouchers for mentees.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> Create voucher
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active vouchers', value: vouchers.filter((v) => v.status === 'Active').length, color: 'text-success' },
          { label: 'Total uses', value: vouchers.reduce((s, v) => s + v.usedCount, 0), color: 'text-primary' },
          { label: 'Expired', value: vouchers.filter((v) => v.status === 'Expired').length, color: 'text-muted-foreground' },
        ].map((s) => (
          <Card key={s.label} className="border-border p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`mt-1 ${s.color}`} style={{ fontSize: '2rem', fontWeight: 800 }}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="border-border p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search code..." className="bg-input-background pl-9" />
          </div>
          <Tabs value={tabFilter} onValueChange={setTabFilter}>
            <TabsList>
              {['All', 'Active', 'Expired', 'Disabled'].map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min. order</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-accent px-2 py-0.5 text-sm" style={{ fontWeight: 700 }}>{v.code}</code>
                      <button onClick={() => copyCode(v.id, v.code)} className="text-muted-foreground hover:text-primary">
                        {copiedId === v.id ? <CheckCircle2 className="size-4 text-success" /> : <Copy className="size-4" />}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell style={{ fontWeight: 600 }}>
                    {v.type === 'percentage' ? `${v.value}%` : formatCurrency(v.value)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(v.minOrder)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">
                      {v.scope === 'mentor' ? `Mentor: ${v.mentorName}` : 'Platform-wide'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span style={{ fontWeight: 600 }}>{v.usedCount}</span>
                      <span className="text-muted-foreground">/ {v.usageLimit}</span>
                      <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, (v.usedCount / v.usageLimit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(v.expiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{v.createdBy}</TableCell>
                  <TableCell>
                    <Badge className={`border ${statusColor[v.status]}`}>{v.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-danger hover:bg-danger/10" onClick={() => remove(v.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <VoucherFormDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
