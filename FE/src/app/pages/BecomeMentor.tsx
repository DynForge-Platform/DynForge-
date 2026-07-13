import { useNavigate } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  ShieldCheck,
  Award,
  HeartHandshake,
  BadgeCheck,
  Star,
  FileCheck,
  UserCheck,
  CalendarRange,
  Banknote,
  Send,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { SectionHeading } from '../components/common';
import { formatCurrency } from '../data/mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function BecomeMentor() {
  const navigate = useNavigate();
  const { T } = useLanguage();
  const { user } = useAuth();

  // Route "Apply now" based on auth state:
  // - not logged in → register first
  // - logged-in mentor → their verification page
  // - logged-in mentee (or other) → the mentor application form (no re-registration needed)
  const handleApply = () => {
    if (!user) navigate('/register?apply=mentor');
    else if (user.role === 'mentor') navigate('/mentor/verification');
    else navigate('/become-a-mentor/apply');
  };

  const benefits = [
    { icon: Wallet, title: T.benefitFlexible, desc: T.benefitFlexibleDesc },
    { icon: ShieldCheck, title: T.benefitPayment, desc: T.benefitPaymentDesc },
    { icon: Award, title: T.benefitReputation, desc: T.benefitReputationDesc },
    { icon: HeartHandshake, title: T.benefitHelp, desc: T.benefitHelpDesc },
    { icon: BadgeCheck, title: T.benefitVerified, desc: T.benefitVerifiedDesc },
    { icon: Star, title: T.benefitReviews, desc: T.benefitReviewsDesc },
  ];

  const requirements = [T.req1, T.req2, T.req3, T.req4];

  const steps = [
    { icon: Send, title: T.step1Title, desc: T.step1Desc },
    { icon: UserCheck, title: T.step2Title, desc: T.step2Desc },
    { icon: CalendarRange, title: T.step3Title, desc: T.step3Desc },
    { icon: HeartHandshake, title: T.step4Title, desc: T.step4Desc },
    { icon: Banknote, title: T.step5Title, desc: T.step5Desc },
  ];

  const faqs = [
    { q: T.faq1Q, a: T.faq1A },
    { q: T.faq2Q, a: T.faq2A },
    { q: T.faq3Q, a: T.faq3A },
    { q: T.faq4Q, a: T.faq4A },
  ];
  const commission = 0.15;
  const gross = 6000000;
  const net = Math.round(gross * (1 - commission));

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-pale-blue to-background">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="text-navy" style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1 }}>
              {T.becomeMentorTitle}
            </h1>
            <p className="mt-5 max-w-xl text-muted-foreground" style={{ fontSize: '1.125rem' }}>
              {T.becomeMentorSubtitle}
            </p>
            <Button size="lg" className="mt-7" onClick={handleApply}>
              {T.applyNow}
            </Button>
          </div>

          {/* Earnings estimate */}
          <Card className="border-border p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">{T.exampleEarnings}</p>
            <p className="mt-1 text-navy" style={{ fontSize: '2.25rem', fontWeight: 800 }}>{formatCurrency(net)}</p>
            <div className="mt-5 space-y-3 text-sm">
              <Row label={T.sessionsCompleted} value="24" />
              <Row label={T.grossEarnings} value={formatCurrency(gross)} />
              <Row label={T.platformCommission} value={`- ${formatCurrency(gross - net)}`} />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span style={{ fontWeight: 600 }}>{T.netPayout}</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(net)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              {T.escrowSafetyNote}
            </div>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-[1240px] px-5 py-20">
        <SectionHeading center eyebrow={T.whyMentorEyebrow} title={T.whyBecomeTitle} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <Card key={b.title} className="border-border p-6">
                <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 style={{ fontWeight: 600 }}>{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Requirements + How it works */}
      <section className="bg-pale-blue/50">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-20 lg:grid-cols-2">
          <div>
            <SectionHeading title={T.requirementsTitle} />
            <div className="space-y-3">
              {requirements.map((r) => (
                <Card key={r} className="flex items-center gap-3 border-border p-4">
                  <FileCheck className="size-5 shrink-0 text-primary" />
                  <span>{r}</span>
                </Card>
              ))}
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=900&q=80"
                alt="Mentor helping a student"
                className="h-56 w-full object-cover"
              />
            </div>
          </div>
          <div>
            <SectionHeading title={T.howItWorksTitle} />
            <ol className="space-y-4">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground" style={{ fontWeight: 600 }}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="flex items-center gap-2" style={{ fontWeight: 600 }}>
                        <Icon className="size-4 text-primary" /> {s.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[760px] px-5 py-20">
        <SectionHeading center title={T.faqTitle} />
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-10 text-center">
          <Button size="lg" onClick={handleApply}>{T.applyNow}</Button>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
