import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Search, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MentorCard } from '../components/MentorCard';
import { subjects, universities, academicLevels, type Mentor } from '../data/mockData';
import { listMentors, backendToMentor } from '../services/mentorService';
import { useLanguage } from '../context/LanguageContext';
import { RoadmapTimeline } from '../components/RoadmapTimeline';
import { GsapTypewriter } from '../components/GsapTypewriter';
import { MouseFollowLight } from '../components/MouseFollowLight';

export function DynForgeCinematicHome() {
  const navigate = useNavigate();
  const { T, lang } = useLanguage();

  const [featured, setFeatured] = useState<Mentor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUniv, setSelectedUniv] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    // Load real verified mentors from backend
    listMentors()
      .then((profiles) => setFeatured(profiles.map(backendToMentor).slice(0, 6)))
      .catch(() => setFeatured([]));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedSubject) params.set('subject', selectedSubject);
    if (selectedUniv) params.set('university', selectedUniv);
    if (selectedLevel) params.set('level', selectedLevel);
    navigate(`/mentors?${params.toString()}`);
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-transparent text-slate-50"
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── High-Performance Interactive Mouse-Following Light Effect ── */}
      <MouseFollowLight />

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 sm:pt-24 pb-20 max-w-7xl mx-auto min-h-[85vh]">
        {/* Category Pill */}
        <div className="animate-fade-rise mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs sm:text-sm font-medium text-cyan-200 shadow-md">
          <ShieldCheck className="size-4 text-cyan-300" />
          <span>{lang === 'vi' ? 'DynForge · Nền tảng Cố vấn Học thuật Ký quỹ' : 'DynForge · Build People. Forge Futures.'}</span>
        </div>

        {/* H1 Headline with GSAP Typewriter animation */}
        <h1
          className="text-5xl sm:text-7xl lg:text-8xl leading-[1.08] tracking-tight max-w-5xl font-normal text-white drop-shadow-md text-center"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {lang === 'vi' ? (
            <GsapTypewriter
              key="home-vi"
              prefix="Học hỏi từ những người "
              highlight="đã từng trải qua."
              duration={2.2}
              highlightClassName="italic text-cyan-300"
            />
          ) : (
            <GsapTypewriter
              key="home-en"
              prefix="Learn from those who have "
              highlight="been there."
              duration={2.2}
              highlightClassName="italic text-cyan-300"
            />
          )}
        </h1>

        {/* Subtitle */}
        <p className="mt-8 text-white/80 text-base sm:text-lg max-w-2xl leading-relaxed animate-fade-rise-delay font-normal">
          {lang === 'vi'
            ? 'Kết nối với anh chị khóa trên, cựu sinh viên & giảng viên đáng tin cậy — những người thấu hiểu môn học, đồ án và lộ trình học tập của bạn tại FPT University.'
            : 'Connect with trusted student mentors, alumni, and lecturers who understand your courses, your projects, and the academic path you are building.'}
        </p>

        {/* Hero CTA Action Group */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-rise-delay-2">
          <button
            onClick={() => navigate('/mentors')}
            className="liquid-glass rounded-full px-10 py-4 text-base font-semibold text-white cursor-pointer hover:scale-[1.03] transition-transform shadow-xl flex items-center gap-2 bg-white/10 border border-white/30"
          >
            <Search className="size-4 text-cyan-300" />
            {lang === 'vi' ? 'Tìm gia sư môn học' : 'Find a Mentor'}
          </button>

          <button
            onClick={() => navigate('/become-a-mentor')}
            className="liquid-glass rounded-full px-8 py-4 text-base font-medium text-white/90 cursor-pointer hover:scale-[1.03] transition-transform shadow-lg border border-white/20 bg-slate-900/40"
          >
            {lang === 'vi' ? 'Trở thành Mentor' : 'Become a Mentor'}
          </button>
        </div>

        {/* Quick Search Card Box (Glassmorphic) */}
        <div className="mt-14 w-full max-w-3xl rounded-3xl border border-white/20 bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 shadow-2xl animate-fade-rise-delay-2">
          <div className="grid gap-3 sm:grid-cols-12">
            <div className="relative sm:col-span-12">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={lang === 'vi' ? 'Tìm theo mã môn (PRJ301, CSD201...), tên mentor, chuyên ngành...' : 'Search by course code (PRJ301, CSD201...), mentor name, major...'}
                className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-500 pl-11 h-12 rounded-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="sm:col-span-4">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-slate-950/80 border-slate-800 text-white rounded-xl h-11">
                  <SelectValue placeholder={lang === 'vi' ? 'Môn học' : 'Subject'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-slate-800">
                  {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-4">
              <Select value={selectedUniv} onValueChange={setSelectedUniv}>
                <SelectTrigger className="bg-slate-950/80 border-slate-800 text-white rounded-xl h-11">
                  <SelectValue placeholder={lang === 'vi' ? 'Trường học' : 'University'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-slate-800">
                  {universities.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-4">
              <Button size="lg" className="w-full h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold" onClick={handleSearch}>
                <Search className="size-4 mr-2" /> {lang === 'vi' ? 'Tìm kiếm' : 'Search'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* ── ROADMAP TIMELINE (GSAP SCROLLTRIGGER FOR MENTEE & MENTOR) ─── */}
      <RoadmapTimeline lang={lang} />
    </div>
  );
}
