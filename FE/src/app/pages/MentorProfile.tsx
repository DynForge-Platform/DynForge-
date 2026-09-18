import { useParams, useNavigate, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import {
  BookOpen,
  PencilLine,
  Microscope,
  GraduationCap,
  Compass,
  FileText,
  MessageSquare,
  Calendar,
  Clock,
  ShieldCheck,
  Video,
  MapPin,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { getMentor, reviews as mockReviews, formatCurrency, type Mentor, type Review } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { StarRating, VerifiedBadge, SectionHeading } from '../components/common';
import { ReviewCard } from '../components/cards';
import { getMentorById, isObjectId, backendToMentor } from '../services/mentorService';
import { listMentorReviews, backendToReview } from '../services/reviewService';

export function MentorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { T, lang } = useLanguage();

  const [mentor, setMentor] = useState<Mentor | undefined>(() => getMentor(id));
  const [profileLoading, setProfileLoading] = useState(isObjectId(id ?? ''));
  const [reviews, setReviews] = useState<Review[]>(isObjectId(id ?? '') ? [] : mockReviews);
  const [mentorUserId, setMentorUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !isObjectId(id)) return;
    getMentorById(id)
      .then((profile) => {
        setMentor(backendToMentor(profile));
        setMentorUserId(profile.userId);
        return listMentorReviews(profile.userId);
      })
      .then((list) => { if (list) setReviews(list.map(backendToReview)); })
      .catch(() => { /* keep whatever is in state */ })
      .finally(() => setProfileLoading(false));
  }, [id]);

  const messageDest = mentorUserId ? `/messages/${mentorUserId}` : '/messages';
  const openMessages = () => { if (requireAuth(messageDest)) navigate(messageDest); };

  const helpAreas = [
    { icon: BookOpen, title: T.helpCourseTutoring, desc: T.helpCourseTutoringDesc },
    { icon: FileText, title: T.helpAssignment, desc: T.helpAssignmentDesc },
    { icon: Microscope, title: T.helpResearch, desc: T.helpResearchDesc },
    { icon: GraduationCap, title: T.helpThesis, desc: T.helpThesisDesc },
    { icon: Compass, title: T.helpCareer, desc: T.helpCareerDesc },
    { icon: PencilLine, title: T.helpWriting, desc: T.helpWritingDesc },
  ];

  const requireAuth = (dest: string) => {
    if (!user) {
      toast.error(T.signInToBook);
      navigate(`/login?redirect=${dest}`);
      return false;
    }
    return true;
  };

  if (profileLoading) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center py-32 text-slate-400 gap-2">
        <Loader2 className="size-5 animate-spin text-cyan-400" /> Loading mentor profile…
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="relative z-10 min-h-screen mx-auto max-w-5xl px-6 py-20 text-center text-slate-100 space-y-4">
        <h1 className="text-4xl font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>{T.mentorNotFound}</h1>
        <Link to="/mentors" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-all">
          <ArrowLeft className="size-4" /> {T.backToMentors}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative z-10 pb-24 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <button
          onClick={() => navigate('/mentors')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>{T.backToMentors}</span>
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            {/* Header Glass Card */}
            <div className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col gap-6 sm:flex-row">
                <ImageWithFallback
                  src={mentor.avatar}
                  alt={mentor.name}
                  className="size-28 shrink-0 rounded-2xl object-cover border border-white/15"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl sm:text-5xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      {mentor.name}
                    </h1>
                    <VerifiedBadge verified={mentor.verified} />
                  </div>
                  <p className="text-cyan-300 font-medium text-sm">{mentor.role}</p>
                  <p className="text-slate-400 text-xs">{mentor.university} · {mentor.major}</p>
                  <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
                    <StarRating rating={mentor.rating} count={mentor.reviewsCount} />
                    <span>{mentor.sessionsCompleted} {T.sessionCompleted}</span>
                    <span>{T.respondsLabel} {mentor.responseTime.toLowerCase()}</span>
                  </div>
                  <div className="pt-4 flex flex-wrap gap-3">
                    <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl h-11 px-6" onClick={() => requireAuth(`/mentors/${mentor.id}/schedule`) && navigate(`/mentors/${mentor.id}/schedule`)}>
                      <Calendar className="size-4 mr-2" /> {T.bookSession}
                    </Button>
                    <Button variant="outline" className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 rounded-xl h-11 px-5" onClick={openMessages}>
                      <MessageSquare className="size-4 mr-2 text-cyan-400" /> {T.messageMentor}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-6 sm:p-8 shadow-xl space-y-3">
              <h2 className="text-3xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {T.aboutMentor}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed font-normal">{mentor.about}</p>
            </div>

            {/* How I can help */}
            <div className="space-y-4">
              <h2 className="text-3xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {T.howICanHelp}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {helpAreas.map((h) => {
                  const Icon = h.icon;
                  return (
                    <div key={h.title} className="flex gap-3.5 rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-5 shadow-md">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{h.title}</h4>
                        <p className="text-xs text-white/60 mt-1 leading-relaxed">{h.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Courses + Strengths */}
            <div className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-6 sm:p-8 shadow-xl space-y-6">
              <div>
                <h2 className="mb-3 text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {T.coursesSupported}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {mentor.courses.map((c) => (
                    <Badge key={c.code} className="bg-white/5 text-cyan-300 border border-white/10 px-3 py-1 text-xs rounded-lg font-normal">
                      {c.code} · {c.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {T.academicStrengths}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {mentor.strengths.map((s) => (
                    <Badge key={s} className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-3 py-1 text-xs rounded-lg font-normal">{s}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-4">
              <h2 className="text-3xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {T.studentReviews}
              </h2>
              {reviews.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-1 shadow-md">
                      <ReviewCard review={r} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-8 text-center text-slate-400 text-xs">
                  No reviews yet — be the first to book and review this mentor.
                </div>
              )}
            </div>
          </div>

          {/* Sticky Glass Sidebar Pricing Card */}
          <aside className="lg:sticky lg:top-[88px] lg:h-fit">
            <div className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-6 shadow-2xl space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{T.sessionPricing}</p>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>{T.groupRate}</span>
                  <span className="font-semibold text-white">{formatCurrency(mentor.groupRate)} / h</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>{T.oneOnOneRate}</span>
                  <span className="font-semibold text-cyan-300 text-sm">{formatCurrency(mentor.hourlyRate)} / h</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Video className="size-4 text-cyan-400" /> <span>Google Meet / Zoom</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-cyan-400" /> <span>On-campus / FPT University</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-400" /> <span>100% Escrow Protected</span>
                </div>
              </div>

              <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl h-11" onClick={() => requireAuth(`/mentors/${mentor.id}/schedule`) && navigate(`/mentors/${mentor.id}/schedule`)}>
                <Calendar className="size-4 mr-2" /> {T.bookSession}
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
