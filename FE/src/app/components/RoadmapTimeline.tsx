import { useEffect, useRef, useState } from 'react';
import { 
  Compass, GraduationCap, ShieldCheck, Award, 
  UserCheck, CalendarCheck, Coins, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router';

declare global {
  interface Window {
    gsap?: any;
    ScrollTrigger?: any;
  }
}

interface RoadmapItem {
  step: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  icon: any;
  tagVi: string;
  tagEn: string;
}

const menteeMilestones: RoadmapItem[] = [
  {
    step: '01',
    titleVi: 'Tìm kiếm Mentor & Môn học',
    titleEn: 'Discover Mentors & Courses',
    descVi: 'Tra cứu theo mã môn học (PRJ301, CSD201...), trường đại học hoặc chọn lọc giảng viên, đàn anh top đầu.',
    descEn: 'Search by exact course code, university, or select top-tier lecturers and senior student mentors.',
    icon: Compass,
    tagVi: 'Lựa chọn',
    tagEn: 'Selection',
  },
  {
    step: '02',
    titleVi: 'Đặt lịch & Ký quỹ an toàn',
    titleEn: 'Book & Escrow Payment',
    descVi: 'Chọn thời gian phù hợp và thanh toán học phí. Khoản tiền được hệ thống DynForge giữ an toàn tuyệt đối.',
    descEn: 'Pick suitable session time and pay. Funds are securely locked in DynForge escrow protection.',
    icon: ShieldCheck,
    tagVi: 'Bảo vệ 100%',
    tagEn: '100% Protected',
  },
  {
    step: '03',
    titleVi: 'Buổi học 1-kèm-1 chất lượng',
    titleEn: '1-on-1 Interactive Learning',
    descVi: 'Tham gia phòng học trực tuyến, giải đáp vướng mắc bài tập, luyện đồ án và chiến thuật vượt qua kỳ thi.',
    descEn: 'Join live online room, solve tough assignments, debug code projects, and master exam strategies.',
    icon: GraduationCap,
    tagVi: 'Học tập',
    tagEn: 'Learning',
  },
  {
    step: '04',
    titleVi: 'Xác nhận & Hoàn tất tiến độ',
    titleEn: 'Confirm & Milestone Success',
    descVi: 'Chỉ giải ngân cho Mentor khi bạn hài lòng với buổi học. Tự tin chinh phục điểm A+ các kỳ học.',
    descEn: 'Funds released to mentor only when you are satisfied. Level up your GPA and career trajectory.',
    icon: Award,
    tagVi: 'Hoàn thành',
    tagEn: 'Achieved',
  },
];

const mentorMilestones: RoadmapItem[] = [
  {
    step: '01',
    titleVi: 'Đăng ký & Xác minh hồ sơ',
    titleEn: 'Apply & Verification',
    descVi: 'Gửi bảng điểm và chứng chỉ chuyên môn để nhận huy hiệu Mentor Uy tín từ DynForge.',
    descEn: 'Submit transcript and verified credentials to earn the DynForge Verified Mentor badge.',
    icon: UserCheck,
    tagVi: 'Xác thực',
    tagEn: 'Verified',
  },
  {
    step: '02',
    titleVi: 'Tùy chỉnh lịch dạy & Học phí',
    titleEn: 'Set Schedule & Rates',
    descVi: 'Tự do thiết lập khung giờ rảnh, mức học phí theo giờ và môn học bạn am hiểu nhất.',
    descEn: 'Define your free time slots, hourly rates, and specific university courses you master.',
    icon: CalendarCheck,
    tagVi: 'Linh hoạt',
    tagEn: 'Flexible',
  },
  {
    step: '03',
    titleVi: 'Dẫn dắt & Trao tri thức',
    titleEn: 'Teach & Mentor Juniors',
    descVi: 'Đồng hành cùng đàn em qua các bài Lab khó, đồ án thực tế và chia sẻ kinh nghiệm phỏng vấn tuyển dụng.',
    descEn: 'Guide junior students through tough labs, capstone projects, and real-world career tips.',
    icon: Sparkles,
    tagVi: 'Chia sẻ',
    tagEn: 'Inspire',
  },
  {
    step: '04',
    titleVi: 'Nhận thu nhập ký quỹ an toàn',
    titleEn: 'Guaranteed Secure Payout',
    descVi: 'Học phí được giải ngân sòng phẳng và bảo đảm qua ký quỹ, không lo rủi ro bùng hủy buổi học.',
    descEn: 'Earn guaranteed income through escrow directly to your bank account with zero payment risk.',
    icon: Coins,
    tagVi: 'Thu nhập',
    tagEn: 'Earnings',
  },
];

export function RoadmapTimeline({ lang = 'vi' }: { lang: 'vi' | 'en' }) {
  const [activeTab, setActiveTab] = useState<'mentee' | 'mentor'>('mentee');
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const items = activeTab === 'mentee' ? menteeMilestones : mentorMilestones;

  useEffect(() => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    if (!gsap || !timelineRef.current) return;

    if (ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    const container = timelineRef.current;
    const line = container.querySelector('.timeline-line');
    const milestoneElements = container.querySelectorAll('.milestone-card');

    // Clean up previous animations
    gsap.killTweensOf(line);
    milestoneElements.forEach((ms) => {
      const dot = ms.querySelector('.milestone-dot');
      if (dot) gsap.killTweensOf(dot);
      gsap.killTweensOf(ms);
    });

    // Create ScrollTrigger timeline that scrubs cleanly across the entire component
    // start: top of container reaches 80% of viewport
    // end: bottom of container reaches 75% of viewport
    const tl = gsap.timeline({
      scrollTrigger: ScrollTrigger
        ? {
            trigger: container,
            start: 'top 78%',
            end: 'bottom 75%',
            scrub: 1.2,
            invalidateOnRefresh: true,
          }
        : undefined,
    });

    if (line) {
      tl.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: 'top center',
          duration: 1.2,
          ease: 'none',
        },
        0
      );
    }

    milestoneElements.forEach((ms, i) => {
      const dot = ms.querySelector('.milestone-dot');
      const timePos = 0.2 + i * 0.25;

      if (dot) {
        tl.fromTo(
          dot,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.45,
            ease: 'back.out(2)',
          },
          timePos
        );
      }

      // Smoothly bring in each card at the same milestone moment
      tl.fromTo(
        ms,
        {
          opacity: 0,
          y: 25,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: 'power2.out',
        },
        timePos
      );
    });

    // Refresh ScrollTrigger after DOM has fully rendered
    const timer = setTimeout(() => {
      if (ScrollTrigger) {
        ScrollTrigger.refresh();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      tl.kill();
      if (ScrollTrigger) {
        ScrollTrigger.getAll().forEach((st: any) => {
          if (st.trigger === container) st.kill();
        });
      }
    };
  }, [activeTab]);

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-24 select-none">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 mb-4 shadow-sm">
          <Compass className="size-4 text-cyan-400" />
          <span>{lang === 'vi' ? 'Lộ trình phát triển DynForge' : 'DynForge Growth Journey'}</span>
        </div>

        <h2
          className="text-4xl sm:text-6xl font-normal text-white tracking-tight leading-tight"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {lang === 'vi' ? (
            <>
              Hành trình đồng hành <span className="text-cyan-300 italic">bứt phá tương lai.</span>
            </>
          ) : (
            <>
              Your guided journey to <span className="text-cyan-300 italic">forge success.</span>
            </>
          )}
        </h2>

        <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
          {lang === 'vi'
            ? 'Quy trình 4 bước chuẩn hóa, minh bạch và an toàn tuyệt đối cho cả Học viên (Mentee) và Gia sư (Mentor).'
            : 'A transparent, secure 4-step roadmap tailored for both Mentees and Mentors.'}
        </p>

        {/* Tab Switcher (Mentee vs Mentor) */}
        <div className="mt-8 inline-flex p-1.5 rounded-full bg-slate-900/80 border border-white/15 backdrop-blur-xl shadow-xl">
          <button
            onClick={() => setActiveTab('mentee')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
              activeTab === 'mentee'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="size-4" />
            <span>{lang === 'vi' ? 'Dành cho Học viên (Mentee)' : 'For Mentees'}</span>
          </button>

          <button
            onClick={() => setActiveTab('mentor')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
              activeTab === 'mentor'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="size-4" />
            <span>{lang === 'vi' ? 'Dành cho Gia sư (Mentor)' : 'For Mentors'}</span>
          </button>
        </div>
      </div>

      {/* GSAP Timeline Container */}
      <div ref={timelineRef} className="timeline relative max-w-4xl mx-auto py-8">
        {/* Animated Connecting Vertical Line (tl.from(".line", { scaleY: 0, transformOrigin: "top center" })) */}
        <div className="timeline-line absolute left-1/2 top-4 bottom-4 -translate-x-1/2 w-0.5 bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(0,229,255,0.6)] hidden md:block" />

        {/* Milestone Items */}
        <div className="space-y-12 md:space-y-16 relative">
          {items.map((item, idx) => {
            const isLeft = idx % 2 === 0;
            const IconComponent = item.icon;

            return (
              <div
                key={`${activeTab}-${item.step}`}
                className={`milestone-card relative flex flex-col md:flex-row items-center ${
                  isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content Box */}
                <div className={`w-full md:w-[46%] ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                  <div className="group relative rounded-3xl border border-white/15 bg-slate-900/70 backdrop-blur-xl p-6 sm:p-7 shadow-xl hover:border-cyan-400/40 hover:bg-slate-900/90 transition-all duration-300">
                    {/* Step Tag */}
                    <div
                      className={`flex items-center gap-2 mb-3 ${
                        isLeft ? 'md:justify-end' : 'md:justify-start'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                        {lang === 'vi' ? item.tagVi : item.tagEn}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        STEP {item.step}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {lang === 'vi' ? item.titleVi : item.titleEn}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                      {lang === 'vi' ? item.descVi : item.descEn}
                    </p>

                    {/* Corner Accent Glow */}
                    <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -z-10 blur-sm" />
                  </div>
                </div>

                {/* Animated Center Milestone Dot (tl.from(".dot", { scale: 0, ease: "back.out(2)" })) */}
                <div className="milestone-dot my-4 md:my-0 md:absolute md:left-1/2 md:-translate-x-1/2 size-11 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(0,229,255,0.7)] z-10">
                  <IconComponent className="size-5 text-cyan-300" />
                </div>

                {/* Empty spacer for the other column */}
                <div className="hidden md:block md:w-[46%]" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Action */}
      <div className="mt-16 text-center">
        <Link
          to={activeTab === 'mentee' ? '/mentors' : '/become-a-mentor'}
          className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:shadow-[0_0_25px_rgba(0,229,255,0.5)] hover:scale-105 active:scale-95 transition-all shadow-lg border border-white/20"
        >
          <span>
            {activeTab === 'mentee'
              ? lang === 'vi' ? 'Bắt đầu tìm Mentor ngay' : 'Find Your Mentor Now'
              : lang === 'vi' ? 'Đăng ký trở thành Mentor' : 'Apply as a Mentor'}
          </span>
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
