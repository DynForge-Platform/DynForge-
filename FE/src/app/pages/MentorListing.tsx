import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, SlidersHorizontal, UserSearch, Loader2, Sparkles } from 'lucide-react';
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
import { majors, formatCurrency, type Mentor } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import { FormattedText } from '../components/FormattedText';
import { listMentors, backendToMentor } from '../services/mentorService';
import { mentorMatch, type MentorMatchResult } from '../services/aiService';
import { toast } from 'sonner';

const roles = ['Senior Student', 'Alumni Mentor', 'Lecturer', 'Research Advisor'];

export function MentorListing() {
  const { T } = useLanguage();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('rating');
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [minRating, setMinRating] = useState('0');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<MentorMatchResult | null>(null);

  const runAdvisor = async (overrideQuery?: string) => {
    const textToRun = (overrideQuery ?? aiQuery).trim();
    if (!textToRun) return;
    if (overrideQuery) setAiQuery(overrideQuery);
    setAiLoading(true);
    try {
      setAiResult(await mentorMatch(textToRun));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Không tư vấn được. Vui lòng thử lại.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    // Only real (verified) mentors from the backend — no mock fallback.
    listMentors()
      .then((profiles) => setMentors(profiles.map(backendToMentor)))
      .catch(() => setMentors([]))
      .finally(() => setLoading(false));
  }, []);

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
  }, [mentors, query, selectedMajors, selectedRoles, maxPrice, minRating, sort]);

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
          {/* AI mentor advisor */}
          <Card className="mb-6 border-primary/30 bg-primary/5 p-5">
            <p className="mb-2 flex items-center gap-1.5 text-primary" style={{ fontWeight: 600 }}>
              <Sparkles className="size-4" /> Tư vấn chọn gia sư bằng AI
            </p>
            <p className="mb-3 text-sm text-muted-foreground">
              Mô tả nhu cầu của bạn, AI sẽ gợi ý gia sư phù hợp nhất từ danh sách thật.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') runAdvisor(); }}
                placeholder="VD: Mình đang rớt Giải tích 1, cần luyện thi cuối kỳ trong 2 tuần…"
                className="h-11 border-2 border-primary/60 bg-background text-sm shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
              />
              <Button onClick={() => runAdvisor()} disabled={aiLoading || !aiQuery.trim()} className="h-11 shrink-0 px-5">
                {aiLoading ? <><Loader2 className="size-4 animate-spin" /> Đang tư vấn…</> : <><Sparkles className="size-4" /> Tư vấn AI</>}
              </Button>
            </div>
            {aiResult && (
              <div className="mt-4 space-y-3 text-sm">
                <FormattedText content={aiResult.advice} />
                {aiResult.matches.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {aiResult.matches.map((m) => (
                      <Link
                        key={m.mentorId}
                        to={`/mentors/${m.mentorId}`}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-background px-3 py-1 text-primary transition-colors hover:bg-primary/10"
                        style={{ fontWeight: 500 }}
                        title={m.reason}
                      >
                        <UserSearch className="size-3.5" /> {m.name}
                      </Link>
                    ))}
                  </div>
                )}
                {aiResult.suggestedQuestions && aiResult.suggestedQuestions.length > 0 && (
                  <div className="mt-3 border-t border-primary/20 pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">💡 Câu hỏi gợi ý tiếp theo:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => runAdvisor(q)}
                          disabled={aiLoading}
                          className="rounded-lg border border-primary/30 bg-background px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                        >
                          💬 {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

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

          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 className="size-5 animate-spin" /> Loading mentors…
            </div>
          ) : filtered.length ? (
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
