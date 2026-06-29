import { useNavigate } from 'react-router';
import heroPhoto from '../../imports/ptuan.jpg';
import {
  Search, ShieldCheck, Star, CreditCard, Target, ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { MentorCard } from '../components/MentorCard';
import { TrustBadge, SectionHeading } from '../components/common';
import { mentors, subjects, universities, academicLevels } from '../data/mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function Home() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { T, lang } = useLanguage();

  const trust = [
    { icon: ShieldCheck, label: T.verifiedMentors },
    { icon: Star,        label: T.realReviews },
    { icon: CreditCard,  label: T.secureEscrow },
    { icon: Target,      label: T.courseMatching },
  ];

  return (
    <div>
      {/* Dev role switcher */}
      <div className="sticky top-[72px] z-40 border-b border-dashed border-primary/30 bg-navy/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-2.5">
          <span className="flex items-center gap-2 text-xs text-white/60" style={{ fontWeight: 500 }}>
            <span className="rounded bg-primary/40 px-1.5 py-0.5 text-white" style={{ fontWeight: 700 }}>DEV</span>
            {T.devPreviewLabel}
          </span>
          <div className="flex items-center gap-2">
            {([
              { label: 'Mentee', role: 'mentee' as const, dot: 'bg-sky-400', path: '/dashboard' },
              { label: 'Mentor', role: 'mentor' as const, dot: 'bg-emerald-400', path: '/mentor/dashboard' },
              { label: 'Admin',  role: 'admin'  as const, dot: 'bg-amber-400', path: '/admin/dashboard' },
            ]).map((r) => (
              <button
                key={r.role}
                onClick={() => { login(r.role); navigate(r.path); }}
                className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
                style={{ fontWeight: 600 }}
              >
                <span className={`size-2 rounded-full ${r.dot}`} />
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-pale-blue to-background">
        <div className="mx-auto max-w-[1240px] px-5 py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-sm text-primary" style={{ fontWeight: 500 }}>
                <ShieldCheck className="size-4" /> {T.escrowProtectedBadge}
              </span>
              <h1
                style={{
                  fontFamily: 'Sora, var(--font-heading)',
                  fontWeight: 800,
                  lineHeight: 1.12,
                  letterSpacing: '-0.02em',
                }}
                className="text-navy"
              >
                {/* Line 1 — plain navy */}
                <span
                  className="block"
                  style={{ fontSize: 'clamp(2.1rem, 4.2vw, 3.75rem)' }}
                >
                  {lang === 'vi'
                    ? 'Đừng để khó khăn cản bước,'
                    : "Don't let challenges hold you back —"}
                </span>
                {/* Line 2 — gradient accent */}
                <span
                  className="block"
                  style={{
                    fontSize: 'clamp(2.1rem, 4.2vw, 3.75rem)',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #1e3acc 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {lang === 'vi'
                    ? 'kết nối ngay với Mentor "nhà F"!'
                    : 'connect with your FPT mentor now!'}
                </span>
              </h1>
              <p
                className="mt-5 max-w-xl text-muted-foreground"
                style={{
                  fontSize: 'clamp(1rem, 1.4vw, 1.125rem)',
                  lineHeight: 1.8,
                  fontFamily: 'Inter, var(--font-sans)',
                  fontWeight: 400,
                  letterSpacing: '0em',
                }}
              >
                {T.heroSubtitle}
              </p>

              {/* Search module */}
              <div className="mt-8 rounded-2xl border border-border bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder={T.searchPlaceholder} className="bg-input-background pl-9" />
                  </div>
                  <Select>
                    <SelectTrigger className="bg-input-background"><SelectValue placeholder={T.subject} /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="bg-input-background"><SelectValue placeholder={T.university} /></SelectTrigger>
                    <SelectContent>
                      {universities.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="bg-input-background"><SelectValue placeholder={T.academicLevel} /></SelectTrigger>
                    <SelectContent>
                      {academicLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="lg" className="md:h-10" onClick={() => navigate('/mentors')}>
                    <Search className="size-4" /> {T.searchMentors}
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                <img
                  src={heroPhoto}
                  alt="FPTU students collaborating together"
                  className="w-full object-cover"
                  style={{ aspectRatio: '4/3' }}
                />
                {/* FPTU brand overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/30 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 px-4 py-2 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground" style={{ fontWeight: 500 }}>{T.fptuCampusLabel}</p>
                  <p className="text-navy" style={{ fontSize: '0.875rem', fontWeight: 700 }}>{T.whereItHappens}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            {trust.map((t) => (
              <TrustBadge key={t.label} icon={t.icon} label={t.label} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured mentors */}
      <section className="mx-auto max-w-[1240px] px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow={T.topMentors}
            title={T.featuredMentors}
            subtitle={T.featuredMentorsSubtitle}
          />
          <Button variant="outline" onClick={() => navigate('/mentors')} className="mb-8">
            {T.browseAll} <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.slice(0, 6).map((m) => (
            <MentorCard key={m.id} mentor={m} />
          ))}
        </div>
      </section>

      {/* Escrow CTA band */}
      <section className="mx-auto max-w-[1240px] px-5 pb-20">
        <div className="overflow-hidden rounded-3xl bg-navy px-8 py-14 text-white sm:px-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700 }} className="text-white">
                {T.escrowTagline}
              </h2>
              <p className="mt-3 max-w-xl text-white/70">
                {T.escrowCTADesc}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button size="lg" onClick={() => navigate('/mentors')}>{T.findMentorCta}</Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => navigate('/become-a-mentor')}
              >
                {T.becomeMentorCta}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
