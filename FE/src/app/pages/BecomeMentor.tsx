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
  ArrowRight,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { EditorialPageHeader } from '../components/EditorialPageHeader';
import { GsapTypewriter } from '../components/GsapTypewriter';
import { MouseFollowLight } from '../components/MouseFollowLight';
import { GsapCounter } from '../components/GsapCounter';

export function BecomeMentor() {
  const navigate = useNavigate();
  const { T, lang } = useLanguage();
  const { user } = useAuth();

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
    { q: T.faq5Q, a: T.faq5A },
  ];

  const commission = 0.15;
  const gross = 6000000;
  const net = Math.round(gross * (1 - commission));

  return (
    <div className="relative z-10 pb-24 text-slate-100">
      {/* ── High-Performance Interactive Mouse-Following Light Effect ── */}
      <MouseFollowLight />

      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow={lang === 'vi' ? 'TRỞ THÀNH MENTOR DYNFORGE' : 'BECOME A DYNFORGE MENTOR'}
        title={
          lang === 'vi' ? (
            <GsapTypewriter
              key="become-vi"
              prefix="Chia sẻ những gì bạn "
              highlight="biết."
              duration={2}
            />
          ) : (
            <GsapTypewriter
              key="become-en"
              prefix="Share what you "
              highlight="know."
              duration={2}
            />
          )
        }
        subtitle={T.becomeMentorSubtitle}
      >
        <button
          onClick={handleApply}
          className="rounded-full border border-white/30 bg-white/10 backdrop-blur-md px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all cursor-pointer shadow-lg hover:scale-[1.02] inline-flex items-center gap-2"
        >
          <span>{T.applyToBecome}</span>
          <ArrowRight className="size-4 text-cyan-400" />
        </button>
      </EditorialPageHeader>

      <div className="max-w-6xl mx-auto px-6 space-y-20">
        {/* Earnings Estimator Glass Card */}
        <section className="rounded-3xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-8 sm:p-12 shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                {lang === 'vi' ? 'THU NHẬP DỰ KIẾN' : 'EARNINGS POTENTIAL'}
              </span>
              <h2 className="text-3xl sm:text-4xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {lang === 'vi' ? 'Thu nhập linh hoạt theo lịch học của bạn.' : 'Flexible income scheduled around your studies.'}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                {lang === 'vi'
                  ? 'Tự thiết lập mức thù lao theo giờ và chủ động quản lý số buổi dạy mỗi tuần. Thanh toán ký quỹ đảm bảo bạn luôn nhận đủ thù lao cho các buổi dạy hoàn tất.'
                  : 'Set your own hourly rate and manage your session slots. Escrow payment guarantees you are paid for every completed session.'}
              </p>
            </div>

            <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-semibold uppercase text-slate-400">{T.exampleEarnings}</span>
                <span className="text-xs text-cyan-300 font-medium">24 {T.sessionsPerMonth}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{T.grossEarnings} (250,000đ × 24h)</span>
                  <span className="font-semibold">
                    <GsapCounter targetValue={gross} suffix=" ₫" duration={2} />
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{T.platformFee} (15%)</span>
                  <span>- <GsapCounter targetValue={gross * commission} suffix=" ₫" duration={2} /></span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                  <span>{T.netPayout}</span>
                  <span className="text-cyan-300">
                    <GsapCounter targetValue={net} suffix=" ₫" duration={2} />
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-cyan-400/80 bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 text-center">
                ✓ {lang === 'vi' ? 'Tiền thù lao được đảm bảo qua Ký quỹ cho mọi buổi học thành công.' : 'Payouts guaranteed for every completed session.'}
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              {lang === 'vi' ? 'VÌ SAO CHỌN DYNFORGE' : 'WHY MENTOR WITH DYNFORGE'}
            </span>
            <h2 className="text-4xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {T.benefitsTitle}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div key={idx} className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-6 transition-all hover:border-cyan-500/40 shadow-xl space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-white text-base">{b.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed font-normal">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Requirements & Process */}
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-8 shadow-xl space-y-6">
            <h2 className="text-3xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {T.reqsTitle}
            </h2>
            <div className="space-y-4">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
                    <FileCheck className="size-3.5" />
                  </div>
                  <p className="leading-relaxed">{req}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-8 shadow-xl space-y-6">
            <h2 className="text-3xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {T.howItWorksTitle}
            </h2>
            <div className="space-y-4">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="flex items-start gap-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-300">
                      0{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{step.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {T.faqTitle}
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md px-6 shadow-md">
                  <AccordionTrigger className="text-white hover:text-cyan-300 text-sm font-medium py-4 text-left">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-slate-400 pb-4 leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </div>
    </div>
  );
}
