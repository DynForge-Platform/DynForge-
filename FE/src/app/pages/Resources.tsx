import { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, Loader2, RotateCcw } from 'lucide-react';
import { Input } from '../components/ui/input';
import { ResourceCard } from '../components/cards';
import { EditorialPageHeader } from '../components/EditorialPageHeader';
import { EmptyState } from '../components/common';
import { type Resource } from '../data/mockData';
import { listResources } from '../services/resourceService';
import { GsapTypewriter } from '../components/GsapTypewriter';
import { MouseFollowLight } from '../components/MouseFollowLight';

const types = ['All', 'Article', 'PDF Guide', 'Video', 'Template'] as const;

export function Resources() {
  const { T, lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listResources()
      .then(setResources)
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      const matchesType = selectedType === 'All' || r.type === selectedType;
      return matchesQuery && matchesType;
    });
  }, [resources, query, selectedType]);

  const reset = () => {
    setSelectedType('All');
    setQuery('');
  };

  return (
    <div className="relative z-10 pb-24 text-slate-100">
      {/* ── High-Performance Interactive Mouse-Following Light Effect ── */}
      <MouseFollowLight />

      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow={lang === 'vi' ? 'THƯ VIỆN HỌC THUẬT DYNFORGE' : 'DYNFORGE ACADEMIC RESOURCES'}
        title={
          lang === 'vi' ? (
            <GsapTypewriter
              key="res-vi"
              prefix="Tài nguyên "
              highlight="học tập."
              duration={2}
            />
          ) : (
            <GsapTypewriter
              key="res-en"
              prefix="Academic "
              highlight="resources."
              duration={2}
            />
          )
        }
        subtitle={
          lang === 'vi'
            ? 'Khám phá bộ sưu tập tài liệu, đề thi, hướng dẫn và template đồ án được biên soạn bởi các gia sư uy tín.'
            : 'Explore curated study guides, templates, and exam prep resources shared by verified mentors.'
        }
      />

      <div className="max-w-6xl mx-auto px-6 space-y-8">
        {/* Floating Search Pill */}
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center rounded-full border border-white/20 bg-[#090f1e]/80 backdrop-blur-xl p-1.5 shadow-2xl transition-all focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-cyan-500/20">
            <Search className="size-5 text-slate-400 ml-4 mr-2 shrink-0" />
            <input
              type="text"
              placeholder={T.searchResources}
              className="w-full bg-transparent border-none text-white placeholder:text-slate-500 outline-none text-sm py-2"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                {lang === 'vi' ? 'Xóa' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`rounded-full px-5 py-2 text-xs sm:text-sm font-medium transition-all ${
                selectedType === t
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {t === 'All' ? (lang === 'vi' ? 'Tất cả tài liệu' : 'All Resources') : t}
            </button>
          ))}
          {(selectedType !== 'All' || query) && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="size-3.5" />
              <span>{lang === 'vi' ? 'Đặt lại' : 'Reset'}</span>
            </button>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 text-cyan-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={lang === 'vi' ? 'Không tìm thấy tài liệu phù hợp' : 'No resources match your search'}
            description={lang === 'vi' ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.' : 'Try a different search query or clear your category filter.'}
            actionLabel={lang === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'}
            onAction={reset}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-1 shadow-xl hover:border-cyan-500/40 transition-all">
                <ResourceCard resource={r} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
