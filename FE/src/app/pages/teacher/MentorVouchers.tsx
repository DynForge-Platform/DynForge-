import { useState } from 'react';
import { Plus, Tag, Copy, CheckCircle2, Trash2, Info } from 'lucide-react';
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
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';

const myMentor = mentors[0]; // Nguyễn Thị Linh (logged-in teacher)

type VoucherType = 'percentage' | 'fixed';
type VoucherStatus = 'Active' | 'Expired' | 'Disabled';

interface MyVoucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  minOrder: number;
  usageLimit: number;
  usedCount: number;
  expiry: string;
  status: VoucherStatus;
}

const initialVouchers: MyVoucher[] = [
  { id: 'mv1', code: 'LINH15', type: 'percentage', value: 15, minOrder: 90000, usageLimit: 50, usedCount: 12, expiry: '2026-08-15', status: 'Active' },
  { id: 'mv2', code: 'TRIAL30K', type: 'fixed', value: 30000, minOrder: 100000, usageLimit: 20, usedCount: 20, expiry: '2026-06-30', status: 'Expired' },
];

const statusColor: Record<VoucherStatus, string> = {
  Active: 'bg-success/10 text-success border-success/20',
  Expired: 'bg-muted text-muted-foreground',
  Disabled: 'bg-danger/10 text-danger border-danger/20',
};

export function MentorVouchers() {
  const [vouchers, setVouchers] = useState<MyVoucher[]>(initialVouchers);
  const [showCreate, setShowCreate] = useState(false);
  const [type, setType] = useState<VoucherType>('percentage');
  const [autoCode, setAutoCode] = useState(true);
  const [code, setCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeCount = vouchers.filter((v) => v.status === 'Active').length;
  const totalUses = vouchers.reduce((s, v) => s + v.usedCount, 0);

  const generateCode = () => {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCode(`${myMentor.name.split(' ').pop()?.toUpperCase().slice(0, 4)}${rand}`);
  };

  const copyCode = (id: string, c: string) => {
    navigator.clipboard.writeText(c).catch(() => {});
    setCopiedId(id);
    toast.success(`Copied "${c}"`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const remove = (id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    toast.success('Voucher removed.');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newV: MyVoucher = {
      id: `mv${Date.now()}`,
      code: code || `GRD${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      type,
      value: 10,
      minOrder: 80000,
      usageLimit: 30,
      usedCount: 0,
      expiry: '2026-09-30',
      status: 'Active',
    };
    setVouchers((prev) => [newV, ...prev]);
    toast.success(`Voucher ${newV.code} created and active!`);
    setShowCreate(false);
    setCode('');
  };

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Vouchers</h1>
          <p className="mt-1 text-muted-foreground">
            Create discount codes for your mentees — attract new students and reward loyal ones.
          </p>
        </div>
        <Button onClick={() => { setShowCreate(true); generateCode(); }}>
          <Plus className="size-4" /> Create voucher
        </Button>
      </div>

      {/* Info banner */}
      <Card className="mb-6 border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-primary" style={{ fontWeight: 600 }}>How mentor vouchers work</p>
            <p className="text-muted-foreground">
              Vouchers you create apply only to sessions booked with you. Mentees enter the code at checkout to get a discount.
              The discount is deducted from your session fee — not charged by GRADORA.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-border p-4">
          <p className="text-sm text-muted-foreground">Active vouchers</p>
          <p className="mt-1 text-success" style={{ fontSize: '2rem', fontWeight: 800 }}>{activeCount}</p>
        </Card>
        <Card className="border-border p-4">
          <p className="text-sm text-muted-foreground">Total uses</p>
          <p className="mt-1 text-primary" style={{ fontSize: '2rem', fontWeight: 800 }}>{totalUses}</p>
        </Card>
        <Card className="border-border p-4">
          <p className="text-sm text-muted-foreground">Max vouchers allowed</p>
          <p className="mt-1" style={{ fontSize: '2rem', fontWeight: 800 }}>5</p>
        </Card>
      </div>

      {/* Voucher table */}
      <Card className="border-border p-6">
        {vouchers.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min. order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((v) => (
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
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <Tag className="mx-auto mb-3 size-10 opacity-30" />
            <p style={{ fontWeight: 500 }}>No vouchers yet</p>
            <p className="text-sm">Create your first voucher to attract more students.</p>
          </div>
        )}
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={() => setShowCreate(false)}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="size-5 text-primary" /> Create mentor voucher
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {/* Code */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Voucher code</Label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <Switch checked={autoCode} onCheckedChange={(v) => { setAutoCode(v); if (v) generateCode(); }} />
                  Auto-generate
                </label>
              </div>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  readOnly={autoCode}
                  placeholder="e.g. LINH20"
                  className="bg-input-background font-mono tracking-widest uppercase"
                  required
                />
                {autoCode && (
                  <Button type="button" variant="outline" size="icon" onClick={generateCode}>
                    <Tag className="size-4" />
                  </Button>
                )}
              </div>
            </div>

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
                <Label className="mb-1.5 block">Value</Label>
                <div className="relative">
                  <Input type="number" placeholder={type === 'percentage' ? '15' : '30000'} className="bg-input-background pr-8" required />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {type === 'percentage' ? '%' : '₫'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Min. order (₫)</Label>
                <Input type="number" placeholder="80000" className="bg-input-background" />
              </div>
              <div>
                <Label className="mb-1.5 block">Usage limit</Label>
                <Input type="number" placeholder="30" className="bg-input-background" required />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Expiry date</Label>
              <Input type="date" className="bg-input-background" defaultValue="2026-09-30" required />
            </div>

            <div className="rounded-xl bg-accent/60 p-3 text-xs text-muted-foreground">
              This voucher applies only to sessions booked with <strong>{myMentor.name}</strong>.
              Discount is deducted from your earnings.
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit"><Plus className="size-4" /> Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
