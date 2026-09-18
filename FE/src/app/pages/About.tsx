import { useNavigate } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import { TrendingUp, Users, Target, ShieldCheck, ArrowRight } from 'lucide-react';
import { EditorialPageHeader } from '../components/EditorialPageHeader';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { GsapTypewriter } from '../components/GsapTypewriter';
import { MouseFollowLight } from '../components/MouseFollowLight';
import { GsapCounter } from '../components/GsapCounter';

export function About() {
  const navigate = useNavigate();
  const { T, lang } = useLanguage();

  const values = [
    { icon: TrendingUp, title: T.valueMutualTitle, desc: T.valueMutualDesc },
    { icon: Users, title: T.valueInclusiveTitle, desc: T.valueInclusiveDesc },
    { icon: Target, title: T.valueActionableTitle, desc: T.valueActionableDesc },
    { icon: ShieldCheck, title: T.valueTrustTitle, desc: T.valueTrustDesc },
  ];

  const stats = [
    { target: 1200, suffix: '+', label: T.stat1Label },
    { target: 18500, suffix: '+', label: T.stat2Label },
    { target: 40, suffix: '+', label: T.stat3Label },
    { target: 4.9, suffix: '/5', decimals: 1, label: T.stat4Label },
  ];

  return (
    <div className="relative z-10 pb-24 text-slate-100">
      {/* ── High-Performance Interactive Mouse-Following Light Effect ── */}
      <MouseFollowLight />

      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow={lang === 'vi' ? 'VỀ CHÚNG TÔI' : 'ABOUT DYNFORGE'}
        title={
          lang === 'vi' ? (
            <GsapTypewriter
              key="about-vi"
              prefix="Đồng hành giúp sinh viên "
              highlight="vượt trội."
              duration={2}
            />
          ) : (
            <GsapTypewriter
              key="about-en"
              prefix="Helping students "
              highlight="move forward."
              duration={2}
            />
          )
        }
        subtitle={T.aboutHeroSub}
      >
        <button
          onClick={() => navigate('/mentors')}
          className="rounded-full border border-white/30 bg-white/5 backdrop-blur-md px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/15 hover:border-white/50 transition-all cursor-pointer shadow-lg hover:scale-[1.02] inline-flex items-center gap-2"
        >
          <span>{T.meetMentors}</span>
          <ArrowRight className="size-4 text-cyan-400" />
        </button>
      </EditorialPageHeader>

      <div className="max-w-6xl mx-auto px-6 space-y-16">
        {/* Banner Image */}
        <section className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1400&q=80"
            alt="Academic mentorship session"
            className="h-72 w-full object-cover sm:h-[450px]"
          />
        </section>

        {/* Mission & Vision */}
        <section className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-8 shadow-xl">
            <h2 className="mb-4 text-3xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {T.ourMission}
            </h2>
            <p className="text-white/70 leading-relaxed text-sm font-normal">{T.missionText}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-8 shadow-xl">
            <h2 className="mb-4 text-3xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {lang === 'vi' ? 'Vì sao chọn DynForge' : 'Why DynForge'}
            </h2>
            <p className="text-white/70 leading-relaxed text-sm font-normal">{T.whyDynForgeText}</p>
          </div>
        </section>

        {/* Values Section */}
        <section className="space-y-8 pt-8 border-t border-white/10">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              {T.whatWeStandFor}
            </span>
            <h2 className="text-4xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {T.communityValuesTitle}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-6 text-center transition-all hover:border-cyan-500/40 shadow-xl">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-semibold text-white text-base">{v.title}</h3>
                  <p className="mt-2 text-xs text-white/60 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stats Band with GSAP Counter */}
        <section className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-3xl sm:text-5xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  <GsapCounter
                    targetValue={s.target}
                    suffix={s.suffix}
                    decimals={s.decimals}
                    duration={2}
                  />
                </p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
