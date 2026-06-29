import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CalendarX, CreditCard, RefreshCcw, BadgeCheck, Lock, Monitor,
  Clock, Mail, ExternalLink, CheckCircle2, LifeBuoy,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '../components/ui/accordion';
import { toast } from 'sonner';

const categories = [
  { icon: CalendarX, label: 'Booking issue', value: 'booking' },
  { icon: CreditCard, label: 'Payment / escrow', value: 'payment' },
  { icon: RefreshCcw, label: 'Refund request', value: 'refund' },
  { icon: BadgeCheck, label: 'Mentor verification', value: 'verification' },
  { icon: Lock, label: 'Account access', value: 'account' },
  { icon: Monitor, label: 'Technical issue', value: 'technical' },
];

const faqs = [
  { q: 'When will my payment be released?', a: 'Payments are held in escrow and released within 24 hours after both you and the mentor confirm the session is completed. If auto-confirmation is enabled, funds release automatically after 48 hours.' },
  { q: 'How do refunds work?', a: 'If a mentor cancels or fails to attend, GRADORA processes a full refund within 3–5 business days. For disputes, our team reviews the case and decides on full or partial refund based on the evidence.' },
  { q: 'How do I open a dispute?', a: 'Go to Dashboard → Disputes & Complaints → Open New Dispute. Select the related session, choose the issue type, and describe the problem. Our team will respond within 48 hours.' },
  { q: 'How do I verify my mentor account?', a: 'Go to your Mentor Dashboard → Verification. Upload your transcript or proof of expertise, verify your university email, and schedule a short verification call. Approval takes 2–3 business days.' },
];

export function ContactSupport() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [ticketId] = useState(`TKT-${Math.floor(100000 + Math.random() * 900000)}`);
  const [category, setCategory] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-[640px] px-5 py-20 text-center">
        <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Support request submitted</h1>
        <p className="mt-3 text-muted-foreground">
          Our team will review your request and respond within 24 hours.
        </p>
        <Card className="mx-auto mt-6 max-w-sm border-border p-5 text-left">
          <p className="text-sm text-muted-foreground">Ticket ID</p>
          <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>{ticketId}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You will receive a confirmation at your registered email address.
          </p>
        </Card>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate('/dashboard/disputes')}>View My Disputes</Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12">
      <div className="mb-8 text-center">
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700 }}>Contact Support</h1>
        <p className="mt-2 text-muted-foreground">
          Need help with a session, payment, dispute, or account issue? Our support team is here to help.
        </p>
      </div>

      {/* Category cards */}
      <div className="mb-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((c) => {
          const Icon = c.icon;
          const active = category === c.value;
          return (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm transition-colors ${
                active ? 'border-primary bg-accent text-primary' : 'border-border bg-white hover:border-primary/50'
              }`}
              style={{ fontWeight: 500 }}
            >
              <Icon className="size-5" />
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <Card className="border-border p-7">
          <h2 className="mb-5" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Submit a request</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Full name</Label>
                <Input placeholder="Your full name" className="bg-input-background" required />
              </div>
              <div>
                <Label className="mb-1.5 block">Email address</Label>
                <Input type="email" placeholder="you@email.com" className="bg-input-background" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Your role</Label>
                <Select>
                  <SelectTrigger className="bg-input-background"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Issue category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-input-background"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Related session ID <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. s1, TXN-10241" className="bg-input-background" />
            </div>
            <div>
              <Label className="mb-1.5 block">Describe your issue</Label>
              <Textarea
                placeholder="Please describe the problem in as much detail as possible..."
                rows={5}
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Attachment <span className="text-muted-foreground">(optional)</span></Label>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-accent/50 px-4 py-3 text-sm text-muted-foreground">
                <LifeBuoy className="size-4 shrink-0" />
                <span>Drag & drop or click to attach a screenshot or document</span>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full">Submit Request</Button>
          </form>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-border p-5">
            <h3 className="mb-3" style={{ fontWeight: 600 }}>Support info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4 shrink-0" />
                <span>Average response: <strong className="text-foreground">under 24 hours</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4 shrink-0" />
                <span>Support hours: <strong className="text-foreground">Mon–Sat, 8AM–8PM GMT+7</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <span>support@gradora.vn</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="size-4" /> Help Center
              </Button>
            </div>
          </Card>

          <Card className="border-border p-5">
            <h3 className="mb-3" style={{ fontWeight: 600 }}>Frequently asked questions</h3>
            <Accordion type="single" collapsible>
              {faqs.map((f) => (
                <AccordionItem key={f.q} value={f.q}>
                  <AccordionTrigger className="text-sm text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </div>
    </div>
  );
}
