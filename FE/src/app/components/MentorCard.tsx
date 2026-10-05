import { Link } from 'react-router';
import { Clock } from 'lucide-react';
import { Mentor, formatCurrency } from '../data/mockData';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { StarRating, VerifiedBadge } from './common';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { cn } from './ui/utils';

const roleKeyMap: Record<string, keyof ReturnType<typeof useLanguage>['T']> = {
  'Senior Student': 'roleSeniorStudent',
  'Alumni Mentor': 'roleAlumniMentor',
  'Lecturer': 'roleLecturer',
  'Research Advisor': 'roleResearchAdvisor',
};

export function MentorCard({ mentor }: { mentor: Mentor }) {
  const { T, lang } = useLanguage();
  const { user } = useAuth();
  const isOwnProfile = Boolean(
    user?.id && (user.id === mentor.id || (mentor.userId && user.id === mentor.userId))
  );
  const roleLabel = (T[roleKeyMap[mentor.role] as keyof typeof T] as string) ?? mentor.role;

  return (
    <Card className="group flex flex-col overflow-hidden border border-white/10 bg-[#090f1e]/90 backdrop-blur-md p-0 transition-all hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-2xl text-slate-100 rounded-2xl">
      <div className="flex items-start gap-4 p-5">
        <ImageWithFallback
          src={mentor.avatar}
          alt={mentor.name}
          className="size-16 shrink-0 rounded-2xl object-cover border border-white/15"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-white text-base">
              {mentor.name}
            </h3>
            {isOwnProfile && (
              <span className="shrink-0 rounded-md border border-cyan-400/40 bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                {lang === 'vi' ? 'Bạn' : 'You'}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-cyan-300">
            {roleLabel}
          </p>
          <p className="truncate text-xs text-slate-400 mt-0.5">{mentor.university}</p>
        </div>
      </div>

      <div className="flex-1 px-5">
        <div className="mb-3">
          <VerifiedBadge verified={mentor.verified} />
        </div>
        <p className="mb-3 line-clamp-2 text-sm text-slate-300 leading-relaxed">{mentor.headline}</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {mentor.expertise.slice(0, 3).map((tag) => (
            <Badge key={tag} className="bg-[#020b18] text-cyan-300 border border-white/10 text-xs px-2.5 py-0.5">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm">
          <StarRating rating={mentor.rating} count={mentor.reviewsCount} />
          <span className="text-slate-400 text-xs">{mentor.sessionsCompleted} {T.sessions}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="size-3.5 text-cyan-400" />
          <span>
            {T.nextAvailable}{' '}
            {new Date(mentor.nextAvailable).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 p-5">
        <div className="mb-3 rounded-xl border border-white/10 bg-[#020b18] px-3 py-2.5 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{T.groupRate}</span>
            <span className="font-semibold text-slate-200">{formatCurrency(mentor.groupRate)}<span className="font-normal text-slate-400">{T.hrUnit}</span></span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{T.oneOnOneRate}</span>
            <span className="font-bold text-cyan-300">{formatCurrency(mentor.hourlyRate)}<span className="font-normal text-slate-400">{T.hrUnit}</span></span>
          </div>
        </div>
        <Link
          to={`/mentors/${mentor.id}`}
          className={cn(
            'liquid-glass flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-medium transition-all shadow-md hover:scale-[1.02]',
            isOwnProfile
              ? 'bg-amber-500/15 border border-amber-400/40 text-amber-200 hover:bg-amber-500/25'
              : 'bg-cyan-600/30 border border-cyan-400/40 text-white hover:bg-cyan-600/40'
          )}
        >
          {isOwnProfile ? (lang === 'vi' ? 'Hồ sơ của bạn' : 'Your Profile') : T.viewProfile}
        </Link>
      </div>
    </Card>
  );
}
