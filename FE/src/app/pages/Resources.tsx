import { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, BookMarked } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Button } from '../components/ui/button';
import { ResourceCard } from '../components/cards';
import { EmptyState } from '../components/common';
import { resources, universities } from '../data/mockData';

const types = ['Article', 'PDF Guide', 'Video', 'Template'] as const;
const levelKeys = ['Undergraduate', 'Graduate', 'Postgraduate'] as const;

export function Resources() {
  const { T } = useLanguage();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string[]>([]);
  const [level, setLevel] = useState<string[]>([]);
  const [uni, setUni] = useState<string[]>([]);

  // Localised display labels for filter options
  const typeLabels: Record<string, string> = {
    'Article': T.article, 'PDF Guide': T.pdfGuide, 'Video': T.video, 'Template': T.template,
  };
  const levelLabels: Record<string, string> = {
    'Undergraduate': T.undergraduate, 'Graduate': T.graduate, 'Postgraduate': T.postgraduate,
  };

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      const matchesType = !type.length || type.includes(r.type);
      const matchesLevel = !level.length || level.includes(r.level);
      const matchesUni = !uni.length || uni.includes(r.university);
      return matchesQuery && matchesType && matchesLevel && matchesUni;
    });
  }, [query, type, level, uni]);

  const reset = () => { setType([]); setLevel([]); setUni([]); setQuery(''); };

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10">
      <div className="mb-8">
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700 }}>{T.resourcesTitle}</h1>
        <p className="mt-1 text-muted-foreground">{T.resourcesSubtitle}</p>
      </div>

      <div className="mb-8 relative max-w-xl">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={T.searchResources}
          className="bg-input-background pl-9"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-[88px] lg:h-fit">
          <Card className="border-border p-5">
            <div className="mb-4 flex items-center justify-between">
              <span style={{ fontWeight: 600 }}>{T.filters}</span>
              <Button variant="ghost" size="sm" className="text-primary" onClick={reset}>{T.reset}</Button>
            </div>
            <FilterGroup label={T.contentType} options={types} labelMap={typeLabels} selected={type} onToggle={(v) => toggle(type, setType, v)} />
            <FilterGroup label={T.levelLabel} options={levelKeys} labelMap={levelLabels} selected={level} onToggle={(v) => toggle(level, setLevel, v)} />
            <FilterGroup label={T.universityLabel} options={universities} selected={uni} onToggle={(v) => toggle(uni, setUni, v)} />
          </Card>
        </aside>

        <div>
          <p className="mb-4 text-sm text-muted-foreground">{T.resourcesFound(filtered.length)}</p>
          {filtered.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookMarked}
              title={T.noResources}
              description={T.noResourcesDesc}
              action={<Button onClick={reset}>{T.clearFilters}</Button>}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  labelMap,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  labelMap?: Record<string, string>;
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="mb-6">
      <Label className="mb-2 block">{label}</Label>
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Checkbox checked={selected.includes(o)} onCheckedChange={() => onToggle(o)} />
            <span>{labelMap?.[o] ?? o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
