import { useNavigate } from 'react-router';
import {
  Search, CreditCard, Video, CheckCircle2,
  UserCheck, CalendarRange, Banknote, ArrowRight,
} from 'lucide-react';
import { EditorialPageHeader } from '../components/EditorialPageHeader';
import { useLanguage } from '../context/LanguageContext';

export function HowItWorks() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const vi = lang === 'vi';

  const studentSteps = [
    {
      icon: Search,
      title: vi ? 'Tìm mentor phù hợp' : 'Find the right mentor',
      desc: vi
        ? 'Lọc theo môn học, hình thức, đánh giá. Xem hồ sơ, chuyên môn và review thật của mentor đã xác minh.'
        : 'Filter by course, format, and rating. Browse verified mentor profiles, expertise, and real reviews.',
    },
    {
      icon: CreditCard,
      title: vi ? 'Đặt lịch & thanh toán ký quỹ' : 'Book & pay into escrow',
      desc: vi
        ? 'Chọn buổi học và thanh toán. Tiền được GIỮ AN TOÀN trong ký quỹ — mentor chưa nhận được ngay.'
        : 'Pick a session and pay. Your money is held safely in escrow — the mentor is not paid yet.',
    },
    {
      icon: Video,
      title: vi ? 'Học cùng mentor' : 'Learn with your mentor',
      desc: vi
        ? 'Tham gia buổi học online hoặc offline. Mentor đánh dấu "đã dạy xong" khi hoàn tất.'
        : 'Join your session online or offline. The mentor marks it as taught once completed.',
    },
    {
      icon: CheckCircle2,
      title: vi ? 'Xác nhận & giải phóng' : 'Confirm & release',
      desc: vi
        ? 'Xác nhận buổi học đạt yêu cầu để giải phóng tiền cho mentor. Nếu có vấn đề, bạn có thể mở tranh chấp.'
        : 'Confirm the session was satisfactory to release payment to the mentor. Not happy? Open a dispute.',
    },
  ];

  const mentorSteps = [
    {
      icon: UserCheck,
      title: vi ? 'Đăng ký & xác minh' : 'Apply & get verified',
      desc: vi
        ? 'Nộp bảng điểm và tài liệu. Đội ngũ DynForge xác minh để đảm bảo chất lượng.'
        : 'Submit your transcript and documents. The DynForge team verifies you for quality.',
    },
    {
      icon: CalendarRange,
      title: vi ? 'Nhận & chấp nhận yêu cầu' : 'Receive & accept requests',
      desc: vi
        ? 'Sinh viên đặt lịch. Bạn chấp nhận hoặc từ chối; buổi đã thanh toán được giữ trong ký quỹ.'
        : 'Students book you. Accept or decline; paid sessions are held safely in escrow.',
    },
    {
      icon: Banknote,
      title: vi ? 'Dạy & nhận thanh toán' : 'Teach & get paid',
      desc: vi
        ? 'Sau khi sinh viên xác nhận (hoặc tự động sau 24h), tiền được chuyển vào ví. Rút về ngân hàng bất cứ lúc nào.'
        : 'After the student confirms (or auto-confirm in 24h), funds land in your wallet. Withdraw anytime.',
    },
  ];

  return (
    <div className="relative z-10 pb-24 text-slate-100">
      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow={vi ? 'QUY TRÌNH HỌC TẬP AN TOÀN' : 'SAFE ACADEMIC ECOSYSTEM'}
        title={
          vi ? (
            <>
              Đơn giản. An toàn. <span className="italic text-cyan-400">Hiệu quả.</span>
            </>
          ) : (
            <>
              Simple. Secure. <span className="italic text-cyan-400">Effective.</span>
            </>
          )
        }
        subtitle={
          vi
            ? 'Kết nối với mentor đã xác minh và học tập an toàn nhờ hệ thống thanh toán ký quỹ — tiền chỉ được giải phóng khi buổi học hoàn tất.'
            : 'Connect with verified mentors and learn safely with escrow-protected payments — money is only released when the session is complete.'
        }
      />

      <div className="max-w-6xl mx-auto px-6 space-y-20">
        {/* Learner Process */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              {vi ? 'DÀNH CHO SINH VIÊN' : 'FOR LEARNERS'}
            </span>
            <h2 className="text-4xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {vi ? '4 bước học cùng Mentor' : 'How to learn with a mentor'}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {studentSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-6 relative transition-all hover:border-cyan-500/40 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-2xl font-light text-slate-500" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      0{idx + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-base">{step.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed font-normal">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Mentor Process */}
        <section className="space-y-8 pt-12 border-t border-white/10">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              {vi ? 'DÀNH CHO GIA SƯ' : 'FOR MENTORS'}
            </span>
            <h2 className="text-4xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {vi ? '3 bước chia sẻ kiến thức & nhận thù lao' : 'How to mentor on DynForge'}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {mentorSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="rounded-2xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-6 relative transition-all hover:border-cyan-500/40 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-2xl font-light text-slate-500" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      0{idx + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-base">{step.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed font-normal">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Bottom Section */}
        <section className="rounded-3xl border border-white/10 bg-[#090f1e]/60 backdrop-blur-md p-8 sm:p-14 text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-5xl text-white font-normal max-w-2xl mx-auto" style={{ fontFamily: "'Instrument Serif', serif" }}>
            {vi ? 'Sẵn sàng chinh phục môn học?' : 'Ready to master your courses?'}
          </h2>
          <p className="text-white/70 text-sm max-w-xl mx-auto">
            {vi
              ? 'Tìm ngay mentor đã vượt qua môn học của bạn để tiết kiệm hàng chục giờ ôn tập.'
              : 'Find a verified student mentor who aced your course and boost your academic results today.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/mentors')}
              className="rounded-full border border-white/30 bg-white/10 backdrop-blur-md px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all cursor-pointer shadow-lg hover:scale-[1.02] inline-flex items-center gap-2"
            >
              <span>{vi ? 'Tìm gia sư ngay' : 'Find a Mentor'}</span>
              <ArrowRight className="size-4 text-cyan-400" />
            </button>
            <button
              onClick={() => navigate('/become-a-mentor')}
              className="rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-8 py-3.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              {vi ? 'Đăng ký làm Gia sư' : 'Become a Mentor'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
