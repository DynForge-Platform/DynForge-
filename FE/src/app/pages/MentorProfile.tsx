import { useParams, useNavigate, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { buttonVariants } from '../components/ui/button';
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
} from 'lucide-react';
import { getMentor, reviews as mockReviews, formatCurrency, type Mentor, type Review } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
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
  const { T } = useLanguage();

  const [mentor, setMentor] = useState<Mentor | undefined>(() => getMentor(id));
  const [profileLoading, setProfileLoading] = useState(isObjectId(id ?? ''));
  // Backend mentors show live reviews; demo (mock) mentors keep the sample reviews.
  const [reviews, setReviews] = useState<Review[]>(isObjectId(id ?? '') ? [] : mockReviews);
  // The mentor's userId (for messaging) — only known for backend mentors.
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
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Loading mentor profile…
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="mx-auto max-w-[1240px] px-5 py-20 text-center">
        <h1>{T.mentorNotFound}</h1>
        <Link to="/mentors" className={buttonVariants() + ' mt-4'}>{T.backToMentors}</Link>
      </div>
    );
  }

  return (
    <div className="bg-pale-blue/40">
      <div className="mx-auto max-w-[1240px] px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Header card */}
            <Card className="border-border p-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <ImageWithFallback
                  src={mentor.avatar}
                  alt={mentor.name}
                  className="size-28 shrink-0 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{mentor.name}</h1>
                    <VerifiedBadge verified={mentor.verified} />
                  </div>
                  <p className="mt-1 text-primary" style={{ fontWeight: 500 }}>{mentor.role}</p>
                  <p className="text-muted-foreground">{mentor.university} · {mentor.major}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <StarRating rating={mentor.rating} count={mentor.reviewsCount} />
                    <span className="text-muted-foreground">{mentor.sessionsCompleted} {T.sessionCompleted}</span>
                    <span className="text-muted-foreground">{T.respondsLabel} {mentor.responseTime.toLowerCase()}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button onClick={() => requireAuth(`/mentors/${mentor.id}/schedule`) && navigate(`/mentors/${mentor.id}/schedule`)}>
                      <Calendar className="size-4" /> {T.bookSession}
                    </Button>
                    <Button variant="outline" onClick={openMessages}>
                      <MessageSquare className="size-4" /> {T.messageMentor}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* About */}
            <Card className="border-border p-6">
              <h2 className="mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{T.aboutMentor}</h2>
              <p className="text-muted-foreground">{mentor.about}</p>
            </Card>

            {/* How I can help */}
            <div>
              <SectionHeading title={T.howICanHelp} />
              <div className="grid gap-4 sm:grid-cols-2">
                {helpAreas.map((h) => {
                  const Icon = h.icon;
                  return (
                    <Card key={h.title} className="flex gap-3 border-border p-5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <h4 style={{ fontWeight: 600 }}>{h.title}</h4>
                        <p className="text-sm text-muted-foreground">{h.desc}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Courses + strengths */}
            <Card className="border-border p-6">
              <h2 className="mb-4" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{T.coursesSupported}</h2>
              <div className="flex flex-wrap gap-2">
                {mentor.courses.map((c) => (
                  <Badge key={c.code} variant="secondary" className="bg-accent text-accent-foreground">
                    {c.code} · {c.name}
                  </Badge>
                ))}
              </div>
              <h2 className="mb-3 mt-6" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{T.academicStrengths}</h2>
              <div className="flex flex-wrap gap-2">
                {mentor.strengths.map((s) => (
                  <Badge key={s} className="bg-primary/10 text-primary border border-primary/20">{s}</Badge>
                ))}
              </div>
            </Card>

            {/* Reviews */}
            <div>
              <SectionHeading title={T.studentReviews} subtitle={`${mentor.reviewsCount} verified reviews · ${mentor.rating.toFixed(1)} ${T.verifiedAvg}`} />
              {reviews.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              ) : (
                <Card className="border-border p-8 text-center text-muted-foreground">
                  No reviews yet — be the first to book and review this mentor.
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-[88px] lg:h-fit">
            <Card className="border-border p-6">
              <p className="mb-2 text-sm text-muted-foreground">{T.sessionPricing}</p>
              <div className="rounded-xl bg-accent/60 px-4 py-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{T.groupRate}</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(mentor.groupRate)}<span className="text-muted-foreground font-normal">/hr</span></span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{T.oneOnOneRate}</span>
                  <span className="text-primary" style={{ fontWeight: 700, fontSize: '1.125rem' }}>{formatCurrency(mentor.hourlyRate)}<span className="text-muted-foreground font-normal text-sm">/hr</span></span>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <Row icon={Clock} label={T.responseTime} value={mentor.responseTime} />
                <Row
                  icon={mentor.formats.includes('Online') ? Video : MapPin}
                  label={T.sessionFormats}
                  value={mentor.formats.join(' & ')}
                />
                <Row icon={Calendar} label={T.nextAvailableLabel} value={new Date(mentor.nextAvailable).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
              </div>

              <Button className="mt-6 w-full" size="lg" onClick={() => requireAuth(`/mentors/${mentor.id}/schedule`) && navigate(`/mentors/${mentor.id}/schedule`)}>
                {T.bookSession}
              </Button>
              <Button variant="outline" className="mt-3 w-full" onClick={openMessages}>
                <MessageSquare className="size-4" /> {T.messageMentor}
              </Button>

              <div className="mt-5 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <span>{T.safePayment}</span>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" /> {label}
      </span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
