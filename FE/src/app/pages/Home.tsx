import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Lottie from 'lottie-react';
import studyingAnimation from '../../assets/animations/Studying.json';
import { Search, ShieldCheck, Star, CreditCard, Target, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MentorCard } from '../components/MentorCard';
import { TrustBadge, SectionHeading } from '../components/common';
import { subjects, universities, academicLevels, type Mentor } from '../data/mockData';
import { listMentors, backendToMentor } from '../services/mentorService';
import { useLanguage } from '../context/LanguageContext';

export function Home() {
  const navigate = useNavigate();
  const { T, lang } = useLanguage();

  const [featured, setFeatured] = useState<Mentor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUniv, setSelectedUniv] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    // Load real verified mentors from backend
    listMentors()
      .then((profiles) => setFeatured(profiles.map(backendToMentor).slice(0, 6)))
      .catch(() => setFeatured([]));
  }, []);

  const trustBadges = [
    { icon: ShieldCheck, label: T.verifiedMentors },
    { icon: Star, label: T.realReviews },
    { icon: CreditCard, label: T.secureEscrow },
    { icon: Target, label: T.courseMatching },
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedSubject) params.set('subject', selectedSubject);
    if (selectedUniv) params.set('university', selectedUniv);
    if (selectedLevel) params.set('level', selectedLevel);
    navigate(`/mentors?${params.toString()}`);
  };

  return (
    <div className="w-full">
      {/* ── 1. HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-pale-blue via-pale-blue/60 to-background">
        <div className="mx-auto max-w-[1240px] px-5 py-12 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-12">

            {/* Left Column: Headlines & Search Form */}
            <div className="lg:col-span-7">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-semibold text-primary shadow-xs">
                <ShieldCheck className="size-4 text-primary" /> {T.escrowProtectedBadge}
              </span>

              <h1 className="leading-tight">
                <span className="block text-navy font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
                  {lang === 'vi' ? 'Đừng để khó khăn cản bước,' : "Don't let challenges hold you back —"}
                </span>
                <span className="block bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
                  {lang === 'vi' ? 'kết nối ngay với Mentor "nhà F"!' : 'connect with your FPT mentor now!'}
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-muted-foreground text-base sm:text-lg leading-relaxed">
                {T.heroSubtitle}
              </p>

              {/* Quick Search Form Box */}
              <div className="mt-8 rounded-2xl border border-border bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={T.searchPlaceholder}
                      className="bg-input-background pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>

                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="bg-input-background"><SelectValue placeholder={T.subject} /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={selectedUniv} onValueChange={setSelectedUniv}>
                    <SelectTrigger className="bg-input-background"><SelectValue placeholder={T.university} /></SelectTrigger>
                    <SelectContent>
                      {universities.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="bg-input-background"><SelectValue placeholder={T.academicLevel} /></SelectTrigger>
                    <SelectContent>
                      {academicLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Button size="lg" className="md:h-10" onClick={handleSearch}>
                    <Search className="size-4" /> {T.searchMentors}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Lottie Animation */}
            <div className="relative hidden lg:flex lg:col-span-5 items-center justify-center">
              <div
                style={{
                  width: '140%',
                  height: '140%',
                  transform: 'translate3d(-20px, -85px, 0px) scale(1.35)',
                  contentVisibility: 'visible',
                }}
              >
                <Lottie animationData={studyingAnimation} loop autoplay style={{ width: '100%', height: '100%' }} />
              </div>
            </div>

          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap gap-3">
            {trustBadges.map((t) => (
              <TrustBadge key={t.label} icon={t.icon} label={t.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. FEATURED MENTORS ─────────────────────────────────────── */}
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
          {featured.map((m) => (
            <MentorCard key={m.id} mentor={m} />
          ))}
        </div>
      </section>

      {/* ── 3. ESCROW SAFETY BAND ─────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-5 pb-20">
        <div className="overflow-hidden rounded-3xl bg-navy px-8 py-14 text-white sm:px-14 shadow-xl">
          <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-white font-extrabold text-2xl sm:text-3xl lg:text-4xl">
                {T.escrowTagline}
              </h2>
              <p className="mt-3 max-w-xl text-white/80 leading-relaxed text-sm sm:text-base">
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
