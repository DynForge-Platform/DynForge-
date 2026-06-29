import { useNavigate } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import { TrendingUp, Users, Target, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { SectionHeading } from '../components/common';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function About() {
  const navigate = useNavigate();
  const { T } = useLanguage();

  const values = [
    { icon: TrendingUp, title: T.valueMutualTitle, desc: T.valueMutualDesc },
    { icon: Users, title: T.valueInclusiveTitle, desc: T.valueInclusiveDesc },
    { icon: Target, title: T.valueActionableTitle, desc: T.valueActionableDesc },
    { icon: ShieldCheck, title: T.valueTrustTitle, desc: T.valueTrustDesc },
  ];

  const stats = [
    { value: T.stat1Value, label: T.stat1Label },
    { value: T.stat2Value, label: T.stat2Label },
    { value: T.stat3Value, label: T.stat3Label },
    { value: T.stat4Value, label: T.stat4Label },
  ];
  return (
    <div>
      <section className="bg-gradient-to-b from-pale-blue to-background">
        <div className="mx-auto max-w-[900px] px-5 py-20 text-center">
          <h1 className="text-navy" style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1 }}>
            {T.aboutHero}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground" style={{ fontSize: '1.125rem' }}>
            {T.aboutHeroSub}
          </p>
          <Button size="lg" className="mt-7" onClick={() => navigate('/mentors')}>{T.meetMentors}</Button>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16">
        <div className="overflow-hidden rounded-3xl">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1400&q=80"
            alt="Academic mentorship session"
            className="h-72 w-full object-cover sm:h-96"
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <Card className="border-border p-8">
            <h2 className="mb-3" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{T.ourMission}</h2>
            <p className="text-muted-foreground">{T.missionText}</p>
          </Card>
          <Card className="border-border p-8">
            <h2 className="mb-3" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{T.whyGradora}</h2>
            <p className="text-muted-foreground">{T.whyGradoraText}</p>
          </Card>
        </div>
      </section>

      <section className="bg-pale-blue/50">
        <div className="mx-auto max-w-[1240px] px-5 py-20">
          <SectionHeading center eyebrow={T.whatWeStandFor} title={T.communityValuesTitle} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title} className="border-border p-6 text-center">
                  <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </span>
                  <h3 style={{ fontWeight: 600 }}>{v.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-20">
        <div className="grid gap-6 rounded-3xl bg-navy px-8 py-12 text-center text-white sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: '2.25rem', fontWeight: 800 }} className="text-white">{s.value}</p>
              <p className="text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
