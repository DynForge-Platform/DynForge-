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
import { PageHeader } from '../components/common';

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
  { q: 'How do refunds work?', a: 'If a mentor cancels or fails to attend, DynForge processes a full refund within 3–5 business days. For disputes, our team reviews the case and decides on full or partial refund based on the evidence.' },
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
      <div className="bg-[#020B18] min-h-screen text-slate-100 flex items-center justify-center p-6">
        <div className="mx-auto max-w-[640px] text-center">
          <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="size-9" />
          </span>
          <h1 className="text-3xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>Support request submitted</h1>
          <p className="mt-3 text-slate-400 text-sm">
            Our team will review your request and respond within 24 hours.
          </p>
          <Card className="mx-auto mt-6 max-w-sm border border-white/10 bg-[#090f1e]/90 p-5 text-left rounded-2xl shadow-2xl">
            <p className="text-xs text-slate-400">Ticket ID</p>
            <p className="font-bold text-cyan-300 text-xl">{ticketId}</p>
            <p className="mt-2 text-xs text-slate-400">
              A confirmation email has been sent to your inbox.
            </p>
          </Card>
          <Button onClick={() => navigate('/dashboard')} className="mt-8 bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-8 py-3 rounded-xl">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#020B18] min-h-screen text-slate-100">
      <div className="mx-auto max-w-[1240px] px-5 py-6">
        <PageHeader
          eyebrow="DYNFORGE SUPPORT CENTER"
          title="How can we"
          highlightWord="help you?"
          subtitle="Submit a support ticket or explore answers to common questions about bookings, payments, and escrow protection."
        />

        <div className="grid gap-8 lg:grid-cols-12 mt-6">
          {/* Ticket Form */}
          <div className="space-y-6 lg:col-span-7">
            <Card className="border border-white/10 bg-[#090f1e]/90 backdrop-blur-xl p-8 text-slate-100 shadow-2xl rounded-2xl">
              <h2 className="mb-2 text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Submit a Support Ticket
              </h2>
              <p className="mb-6 text-xs text-slate-400">Fill in the details below and our team will get back to you within 24 hours.</p>

              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">Your Name</Label>
                    <Input placeholder="John Doe" className="bg-[#020b18] border-white/10 text-white placeholder:text-slate-500 rounded-xl" required />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">Your Email</Label>
                    <Input type="email" placeholder="student@university.edu.vn" className="bg-[#020b18] border-white/10 text-white placeholder:text-slate-500 rounded-xl" required />
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-[#020b18] border-white/10 text-white rounded-xl"><SelectValue placeholder="Select topic" /></SelectTrigger>
                    <SelectContent className="bg-[#090f1e] border-white/10 text-white">
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">Subject</Label>
                  <Input placeholder="Brief description of your issue" className="bg-[#020b18] border-white/10 text-white placeholder:text-slate-500 rounded-xl" required />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">Message / Issue Details</Label>
                  <Textarea placeholder="Include booking code, mentor name, or error details..." rows={4} className="bg-[#020b18] border-white/10 text-white placeholder:text-slate-500 rounded-xl" required />
                </div>

                <Button type="submit" className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl shadow-xl text-base">
                  Submit Ticket
                </Button>
              </form>
            </Card>
          </div>

          {/* Sidebar & FAQs */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="border border-white/10 bg-[#090f1e]/90 backdrop-blur-xl p-6 text-slate-100 shadow-2xl rounded-2xl">
              <h2 className="mb-4 text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-white/10">
                    <AccordionTrigger className="text-sm text-slate-200 hover:text-cyan-300">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-400 leading-relaxed">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>

            <Card className="border border-white/10 bg-[#090f1e]/90 backdrop-blur-xl p-6 text-slate-100 shadow-2xl rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <LifeBuoy className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Need Urgent Help?</h3>
                  <p className="text-xs text-slate-400">Email our support desk directly at <a href="mailto:dynforge.edu.hcmcity@gmail.com" className="text-cyan-400 hover:underline">dynforge.edu.hcmcity@gmail.com</a></p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
