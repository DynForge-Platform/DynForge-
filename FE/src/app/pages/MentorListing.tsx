import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, UserSearch } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card } from '../components/ui/card';
import { MentorCard } from '../components/MentorCard';
import { EmptyState } from '../components/common';
import { mentors, majors, formatCurrency } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';

const roles = ['Senior Student', 'Alumni Mentor', 'Lecturer', 'Research Advisor'];

export function MentorListing() {
  const { T } = useLanguage();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('rating');
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(120000);
  const [minRating, setMinRating] = useState('0');

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    let list = mentors.filter((m) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.major.toLowerCase().includes(q) ||
        m.university.toLowerCase().includes(q) ||
        m.courses.some((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
      const matchesMajor = !selectedMajors.length || selectedMajors.includes(m.major);
      const matchesRole = !selectedRoles.length || selectedRoles.includes(m.role);
      const matchesPrice = m.hourlyRate <= maxPrice;
      const matchesRating = m.rating >= Number(minRating);
      return matchesQuery && matchesMajor && matchesRole && matchesPrice && matchesRating;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'priceLow') return a.hourlyRate - b.hourlyRate;
      if (sort === 'priceHigh') return b.hourlyRate - a.hourlyRate;
      if (sort === 'sessions') return b.sessionsCompleted - a.sessionsCompleted;
      return 0;
    });
    return list;
  }, [query, selectedMajors, selectedRoles, maxPrice, minRating, sort]);

  const reset = () => {
    setSelectedMajors([]);
    setSelectedRoles([]);
    setMaxPrice(120000);
    setMinRating('0');
    setQuery('');
  };

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10">
      <div className="mb-8">
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700 }}>{T.findMentorsTitle}</h1>
        <p className="mt-1 text-muted-foreground">{T.findMentorsSubtitle}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className="lg:sticky lg:top-[88px] lg:h-fit">
          <Card className="border-border p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2" style={{ fontWeight: 600 }}>
                <SlidersHorizontal className="size-4" /> {T.filters}
              </span>
              <Button variant="ghost" size="sm" className="text-primary" onClick={reset}>
                {T.reset}
              </Button>
            </div>

            <div className="space-y-6">
              {/* Majors */}
              <div>
                <Label className="mb-2 block">{T.majors}</Label>
                <div className="space-y-2">
                  {majors.map((m) => (
                    <label key={m} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={selectedMajors.includes(m)}
                        onCheckedChange={() => toggle(selectedMajors, setSelectedMajors, m)}
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Teaching role */}
              <div>
                <Label className="mb-2 block">{T.teachingRole}</Label>
                <div className="space-y-2">
                  {roles.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={selectedRoles.includes(r)}
                        onCheckedChange={() => toggle(selectedRoles, setSelectedRoles, r)}
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price slider */}
              <div>
                <Label className="mb-2 block">{T.maxPricePerHour}</Label>
                <Slider
                  value={[maxPrice]}
                  min={50000}
                  max={120000}
                  step={5000}
                  onValueChange={(v) => setMaxPrice(v[0])}
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>50.000₫</span>
                  <span style={{ fontWeight: 500 }}>Up to {formatCurrency(maxPrice)}</span>
                  <span>120.000₫</span>
                </div>
              </div>

              {/* Rating */}
              <div>
                <Label className="mb-2 block">{T.minRating}</Label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{T.anyRating}</SelectItem>
                    <SelectItem value="4.5">4.5+</SelectItem>
                    <SelectItem value="4.8">4.8+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={T.searchPlaceholder}
                className="bg-input-background pl-9"
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">{T.topRated}</SelectItem>
                <SelectItem value="sessions">{T.mostSessions}</SelectItem>
                <SelectItem value="priceLow">{T.priceLowHigh}</SelectItem>
                <SelectItem value="priceHigh">{T.priceHighLow}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="mb-4 text-sm text-muted-foreground">
            {T.mentorsFound(filtered.length)}
          </p>

          {filtered.length ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((m) => (
                  <MentorCard key={m.id} mentor={m} />
                ))}
              </div>
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled>{T.previous}</Button>
                <Button size="sm" className="w-9">1</Button>
                <Button variant="outline" size="sm" className="w-9">2</Button>
                <Button variant="outline" size="sm" className="w-9">3</Button>
                <Button variant="outline" size="sm">{T.next}</Button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={UserSearch}
              title="No mentors match your filters"
              description="Try widening your price range or removing some filters."
              action={<Button onClick={reset}>Clear filters</Button>}
            />
          )}
        </div>
      </div>
    </div>
  );
}
