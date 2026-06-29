import { FileText, Film, FileType2, BookOpen, Download, Play, ArrowUpRight } from 'lucide-react';
import { Resource, Review } from '../data/mockData';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { StarRating } from './common';
import { cn } from './ui/utils';

const typeMeta: Record<Resource['type'], { icon: React.ElementType; action: string; actionIcon: React.ElementType; color: string }> = {
  Article: { icon: BookOpen, action: 'Read', actionIcon: ArrowUpRight, color: 'bg-primary/10 text-primary' },
  'PDF Guide': { icon: FileText, action: 'Download', actionIcon: Download, color: 'bg-danger/10 text-danger' },
  Video: { icon: Film, action: 'Watch', actionIcon: Play, color: 'bg-success/10 text-success' },
  Template: { icon: FileType2, action: 'Download', actionIcon: Download, color: 'bg-warning/10 text-warning' },
};

export function ResourceCard({ resource }: { resource: Resource }) {
  const meta = typeMeta[resource.type];
  const Icon = meta.icon;
  const ActionIcon = meta.actionIcon;
  return (
    <Card className="group flex flex-col gap-4 border-border p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <span className={cn('flex size-10 items-center justify-center rounded-xl', meta.color)}>
          <Icon className="size-5" />
        </span>
        <Badge variant="secondary" className="bg-accent text-accent-foreground">
          {resource.type}
        </Badge>
      </div>
      <div className="flex-1">
        <h3 className="mb-1" style={{ fontWeight: 600 }}>
          {resource.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{resource.description}</p>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="truncate text-sm text-muted-foreground">{resource.source}</span>
        <Button variant="ghost" size="sm" className="text-primary">
          {meta.action} <ActionIcon className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="flex flex-col gap-3 border-border p-5">
      <div className="flex items-center gap-3">
        <ImageWithFallback
          src={review.avatar}
          alt={review.author}
          className="size-10 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate" style={{ fontWeight: 600 }}>
            {review.author}
          </p>
          <p className="truncate text-sm text-muted-foreground">{review.course}</p>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-sm text-muted-foreground">{review.text}</p>
      <span className="text-xs text-muted-foreground">
        {new Date(review.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    </Card>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = 'primary',
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ElementType;
  tone?: 'primary' | 'success' | 'warning';
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  };
  return (
    <Card className="flex flex-col gap-3 border-border p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn('flex size-9 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="size-4.5" />
        </span>
      </div>
      <div>
        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</p>
        {delta && <p className="mt-1 text-sm text-success">{delta}</p>}
      </div>
    </Card>
  );
}
