import { Link } from 'react-router';
import { Clock } from 'lucide-react';
import { Mentor, formatCurrency } from '../data/mockData';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { buttonVariants } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { StarRating, VerifiedBadge } from './common';
import { useLanguage } from '../context/LanguageContext';

// Map English role keys → translation keys
const roleKeyMap: Record<string, keyof ReturnType<typeof useLanguage>['T']> = {
  'Senior Student': 'roleSeniorStudent',
  'Alumni Mentor': 'roleAlumniMentor',
  'Lecturer': 'roleLecturer',
  'Research Advisor': 'roleResearchAdvisor',
};

export function MentorCard({ mentor }: { mentor: Mentor }) {
  const { T } = useLanguage();
  const roleLabel = (T[roleKeyMap[mentor.role] as keyof typeof T] as string) ?? mentor.role;

  return (
    <Card className="group flex flex-col overflow-hidden border-border p-0 transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start gap-4 p-5">
        <ImageWithFallback
          src={mentor.avatar}
          alt={mentor.name}
          className="size-16 shrink-0 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate" style={{ fontWeight: 600 }}>
            {mentor.name}
          </h3>
          <p className="text-sm text-primary" style={{ fontWeight: 500 }}>
            {roleLabel}
          </p>
          <p className="truncate text-sm text-muted-foreground">{mentor.university}</p>
        </div>
      </div>

      <div className="flex-1 px-5">
        <div className="mb-3">
          <VerifiedBadge verified={mentor.verified} />
        </div>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{mentor.headline}</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {mentor.expertise.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-accent text-accent-foreground">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm">
          <StarRating rating={mentor.rating} count={mentor.reviewsCount} />
          <span className="text-muted-foreground">{mentor.sessionsCompleted} {T.sessions}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" />
          <span>
            {T.nextAvailable}{' '}
            {new Date(mentor.nextAvailable).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-border p-5">
        <div className="mb-3 rounded-xl bg-accent/60 px-3 py-2.5 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{T.groupRate}</span>
            <span style={{ fontWeight: 700 }}>{formatCurrency(mentor.groupRate)}<span className="font-normal text-muted-foreground">{T.hrUnit}</span></span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{T.oneOnOneRate}</span>
            <span className="text-primary" style={{ fontWeight: 700 }}>{formatCurrency(mentor.hourlyRate)}<span className="font-normal text-muted-foreground">{T.hrUnit}</span></span>
          </div>
        </div>
        <Link to={`/mentors/${mentor.id}`} className={buttonVariants({ size: 'sm', className: 'w-full justify-center' })}>
          {T.viewProfile}
        </Link>
      </div>
    </Card>
  );
}
