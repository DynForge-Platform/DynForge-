import { FileText, Film, FileType2, BookOpen, Download, Play, ArrowUpRight } from 'lucide-react';
import { Resource, Review } from '../data/mockData';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { StarRating } from './common';
import { cn } from './ui/utils';
import { GsapCounter } from './GsapCounter';

const typeMeta: Record<Resource['type'], { icon: React.ElementType; action: string; actionIcon: React.ElementType; color: string }> = {
  Article: { icon: BookOpen, action: 'Read', actionIcon: ArrowUpRight, color: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
  'PDF Guide': { icon: FileText, action: 'Download', actionIcon: Download, color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
  Video: { icon: Film, action: 'Watch', actionIcon: Play, color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  Template: { icon: FileType2, action: 'Download', actionIcon: Download, color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
};

export function ResourceCard({ resource }: { resource: Resource }) {
  const meta = typeMeta[resource.type];
  const Icon = meta.icon;
  const ActionIcon = meta.actionIcon;
  return (
    <Card className="group flex flex-col gap-4 border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 transition-all hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl text-slate-100 rounded-2xl">
      <div className="flex items-center justify-between">
        <span className={cn('flex size-10 items-center justify-center rounded-xl', meta.color)}>
          <Icon className="size-5" />
        </span>
        <Badge className="bg-slate-950 text-cyan-300 border border-slate-800 text-xs">
          {resource.type}
        </Badge>
      </div>
      <div className="flex-1">
        <h3 className="mb-1 font-semibold text-white text-base">
          {resource.title}
        </h3>
        <p className="line-clamp-2 text-sm text-slate-400 leading-relaxed">{resource.description}</p>
      </div>
      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <span className="truncate text-xs text-slate-400 font-medium">{resource.source}</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
          disabled={!resource.url}
          onClick={() => resource.url && window.open(resource.url, '_blank', 'noopener,noreferrer')}
        >
          {meta.action} <ActionIcon className="size-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="flex flex-col gap-3 border border-slate-800 bg-slate-900/80 p-5 text-slate-100 rounded-2xl">
      <div className="flex items-center gap-3">
        <ImageWithFallback
          src={review.avatar}
          alt={review.author}
          className="size-10 rounded-full object-cover border border-slate-700"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">
            {review.author}
          </p>
          <p className="truncate text-xs text-slate-400">{review.course}</p>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{review.text}</p>
      <span className="text-xs text-slate-500 font-medium">
        {new Date(review.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    </Card>
  );
}

function parseMetric(val: string): { num: number; prefix: string; suffix: string; decimals: number } | null {
  const trimmed = val.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') return null;

  // Rating: e.g. "4.8 / 5" or "5 / 5"
  const ratingMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(\/\s*5)$/);
  if (ratingMatch) {
    const num = parseFloat(ratingMatch[1]);
    return { num, prefix: '', suffix: ` ${ratingMatch[2].replace(/\s+/g, ' ').trim()}`, decimals: ratingMatch[1].includes('.') ? 1 : 0 };
  }

  // Hours: e.g. "12.5h" or "10h"
  const hoursMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h$/i);
  if (hoursMatch) {
    const num = parseFloat(hoursMatch[1]);
    return { num, prefix: '', suffix: 'h', decimals: hoursMatch[1].includes('.') ? 1 : 0 };
  }

  // Percentage: e.g. "15%" or "15.5%"
  const percentMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (percentMatch) {
    const num = parseFloat(percentMatch[1]);
    return { num, prefix: '', suffix: '%', decimals: percentMatch[1].includes('.') ? 1 : 0 };
  }

  // Currency: e.g. "1.250.000₫" or "1,250,000₫" or "0₫"
  if (trimmed.endsWith('₫')) {
    const withoutDong = trimmed.slice(0, -1).trim();
    const cleanDigits = withoutDong.replace(/[.,\s]/g, '');
    if (/^-?\d+$/.test(cleanDigits)) {
      const num = parseInt(cleanDigits, 10);
      return { num, prefix: '', suffix: '₫', decimals: 0 };
    }
  }

  // Currency with prefix $: e.g. "$1,248"
  if (trimmed.startsWith('$')) {
    const withoutDollar = trimmed.slice(1).trim();
    const cleanDigits = withoutDollar.replace(/[.,\s]/g, '');
    if (/^-?\d+$/.test(cleanDigits)) {
      const num = parseInt(cleanDigits, 10);
      return { num, prefix: '$', suffix: '', decimals: 0 };
    }
  }

  // Pure integer or decimal number: e.g. "128" or "1,248" or "12.5"
  const cleanNumStr = trimmed.replace(/,/g, '');
  if (/^-?\d+$/.test(cleanNumStr)) {
    return { num: parseInt(cleanNumStr, 10), prefix: '', suffix: '', decimals: 0 };
  }
  if (/^-?\d+\.\d+$/.test(cleanNumStr)) {
    const parts = cleanNumStr.split('.');
    return { num: parseFloat(cleanNumStr), prefix: '', suffix: '', decimals: parts[1].length };
  }

  return null;
}

export function KpiCard({
  label,
  value,
  numericValue,
  prefix,
  suffix,
  decimals,
  delta,
  icon: Icon,
  tone = 'primary',
}: {
  label: string;
  value?: React.ReactNode;
  numericValue?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delta?: string;
  icon: React.ElementType;
  tone?: 'primary' | 'success' | 'warning';
}) {
  const tones = {
    primary: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  };

  let renderedValue: React.ReactNode = value;

  if (numericValue !== undefined) {
    renderedValue = (
      <GsapCounter
        targetValue={numericValue}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
      />
    );
  } else if (typeof value === 'number') {
    renderedValue = (
      <GsapCounter
        targetValue={value}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals ?? (Number.isInteger(value) ? 0 : 1)}
      />
    );
  } else if (typeof value === 'string') {
    const parsed = parseMetric(value);
    if (parsed) {
      renderedValue = (
        <GsapCounter
          targetValue={parsed.num}
          prefix={prefix ?? parsed.prefix}
          suffix={suffix ?? parsed.suffix}
          decimals={decimals ?? parsed.decimals}
        />
      );
    }
  }

  return (
    <Card className="flex flex-col gap-3 border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 text-slate-100 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={cn('flex size-9 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="size-4.5" />
        </span>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white">{renderedValue}</p>
        {delta && <p className="mt-1 text-xs text-emerald-400 font-medium">{delta}</p>}
      </div>
    </Card>
  );
}
