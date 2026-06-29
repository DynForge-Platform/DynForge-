import { Star, ShieldCheck, BadgeCheck } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import { useLanguage } from '../context/LanguageContext';

export function StarRating({
  rating,
  count,
  size = 'sm',
}: {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star
        className={cn('fill-warning text-warning', size === 'sm' ? 'size-4' : 'size-5')}
      />
      <span className="text-foreground" style={{ fontWeight: 600 }}>
        {rating.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="text-muted-foreground text-sm">({count})</span>
      )}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  const { T } = useLanguage();
  if (!verified)
    return (
      <Badge variant="secondary" className="gap-1 bg-muted text-muted-foreground">
        {T.unverified}
      </Badge>
    );
  return (
    <Badge className="gap-1 bg-success/10 text-success border border-success/20">
      <BadgeCheck className="size-3.5" /> {T.verified}
    </Badge>
  );
}

const statusStyles: Record<string, string> = {
  Upcoming: 'bg-primary/10 text-primary border-primary/20',
  'In Escrow': 'bg-warning/10 text-warning border-warning/20',
  Completed: 'bg-success/10 text-success border-success/20',
  Scheduled: 'bg-success/10 text-success border-success/20',
  Cancelled: 'bg-danger/10 text-danger border-danger/20',
  Refunded: 'bg-success/10 text-success border-success/20',
  Released: 'bg-success/10 text-success border-success/20',
  'Pending Payout': 'bg-warning/10 text-warning border-warning/20',
  Pending: 'bg-warning/10 text-warning border-warning/20',
  Open: 'bg-danger/10 text-danger border-danger/20',
  'Under Review': 'bg-warning/10 text-warning border-warning/20',
  Resolved: 'bg-success/10 text-success border-success/20',
  Rejected: 'bg-danger/10 text-danger border-danger/20',
  'Waiting for Mentor': 'bg-warning/10 text-warning border-warning/20',
  Approved: 'bg-success/10 text-success border-success/20',
  Active: 'bg-success/10 text-success border-success/20',
  Suspended: 'bg-danger/10 text-danger border-danger/20',
  Paid: 'bg-success/10 text-success border-success/20',
  Failed: 'bg-danger/10 text-danger border-danger/20',
  Low: 'bg-success/10 text-success border-success/20',
  Medium: 'bg-warning/10 text-warning border-warning/20',
  High: 'bg-danger/10 text-danger border-danger/20',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn('border', statusStyles[status] ?? 'bg-muted text-muted-foreground')}>
      {status}
    </Badge>
  );
}

export function TrustBadge({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 backdrop-blur">
      <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="text-sm text-foreground" style={{ fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

export function EmptyState({
  icon: Icon = ShieldCheck,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-pale-blue px-6 py-16 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-7" />
      </span>
      <h3 className="mb-1">{title}</h3>
      <p className="mb-6 max-w-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function StepProgress({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done = i <= current;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-full border-2 text-sm',
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-white text-muted-foreground'
                )}
                style={{ fontWeight: 600 }}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'max-w-[120px] text-center text-xs',
                  done ? 'text-foreground' : 'text-muted-foreground'
                )}
                style={{ fontWeight: 500 }}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 flex-1 rounded-full',
                  i < current ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={cn('mb-8', center && 'text-center')}>
      {eyebrow && (
        <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs text-primary" style={{ fontWeight: 600 }}>
          {eyebrow}
        </span>
      )}
      <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700 }}>{title}</h2>
      {subtitle && (
        <p className={cn('mt-2 text-muted-foreground', center && 'mx-auto max-w-2xl')}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
