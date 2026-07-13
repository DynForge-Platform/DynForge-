import { useNavigate } from 'react-router';
import {
  Search, CreditCard, Video, CheckCircle2, ShieldCheck, Wallet,
  UserCheck, CalendarRange, Banknote, ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { SectionHeading } from '../components/common';
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
        ? 'Nộp bảng điểm và tài liệu. Đội ngũ GRADORA xác minh để đảm bảo chất lượng.'
        : 'Submit your transcript and documents. The GRADORA team verifies you for quality.',
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
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-pale-blue to-background">
        <div className="mx-auto max-w-[860px] px-5 py-20 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-sm text-primary" style={{ fontWeight: 500 }}>
            <ShieldCheck className="size-4" /> {vi ? 'Bảo vệ bằng ký quỹ' : 'Escrow protected'}
          </span>
          <h1 className="text-navy" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.15 }}>
            {vi ? 'GRADORA hoạt động như thế nào?' : 'How GRADORA works'}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground" style={{ fontSize: '1.125rem' }}>
            {vi
              ? 'Kết nối với mentor đã xác minh và học tập an toàn nhờ hệ thống thanh toán ký quỹ — tiền chỉ được giải phóng khi buổi học hoàn tất.'
              : 'Connect with verified mentors and learn safely with escrow-protected payments — money is only released when the session is complete.'}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/mentors')}>
              {vi ? 'Tìm mentor' : 'Find a mentor'} <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/become-a-mentor')}>
              {vi ? 'Trở thành mentor' : 'Become a mentor'}
            </Button>
          </div>
        </div>
      </section>

      {/* Student steps */}
      <section className="mx-auto max-w-[1240px] px-5 py-20">
        <SectionHeading
          center
          eyebrow={vi ? 'Dành cho sinh viên' : 'For students'}
          title={vi ? '4 bước để bắt đầu học' : '4 steps to start learning'}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {studentSteps.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="relative border-border p-6">
                <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="absolute right-5 top-5 text-3xl text-border" style={{ fontWeight: 800 }}>{i + 1}</span>
                <h3 style={{ fontWeight: 600 }}>{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Escrow explainer */}
      <section className="bg-pale-blue/50">
        <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-20 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHeading
              eyebrow={vi ? 'An toàn' : 'Safety first'}
              title={vi ? 'Thanh toán ký quỹ chống lừa đảo' : 'Escrow payments, anti-fraud by design'}
            />
            <ul className="space-y-4">
              {[
                vi ? 'Tiền của bạn được giữ an toàn khi đặt lịch, không chuyển thẳng cho mentor.' : 'Your money is held safely on booking — never sent straight to the mentor.',
                vi ? 'Mentor chỉ nhận tiền sau khi bạn xác nhận buổi học hoàn tất.' : 'The mentor is paid only after you confirm the session is complete.',
                vi ? 'Không hài lòng? Mở tranh chấp để admin xử lý hoàn tiền hoặc giải phóng.' : 'Not satisfied? Open a dispute and an admin resolves a refund or release.',
                vi ? 'Tự động xác nhận sau 24 giờ nếu bạn không phản hồi.' : 'Auto-confirmation after 24 hours if you take no action.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="border-border p-6">
            <div className="space-y-3">
              {[
                { icon: CreditCard, label: vi ? 'Thanh toán → Ký quỹ giữ tiền' : 'Pay → Escrow holds funds', tone: 'bg-primary/10 text-primary' },
                { icon: Video, label: vi ? 'Buổi học diễn ra' : 'Session takes place', tone: 'bg-accent text-foreground' },
                { icon: CheckCircle2, label: vi ? 'Xác nhận → Giải phóng cho mentor' : 'Confirm → Release to mentor', tone: 'bg-success/10 text-success' },
                { icon: Wallet, label: vi ? 'Mentor rút về ngân hàng' : 'Mentor withdraws to bank', tone: 'bg-primary/10 text-primary' },
              ].map((row, i) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-3 rounded-xl border border-border p-4">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${row.tone}`}>
                      <Icon className="size-5" />
                    </span>
                    <span style={{ fontWeight: 500 }}>{row.label}</span>
                    <span className="ml-auto text-sm text-muted-foreground">{i + 1}/4</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      {/* Mentor steps */}
      <section className="mx-auto max-w-[1240px] px-5 py-20">
        <SectionHeading
          center
          eyebrow={vi ? 'Dành cho mentor' : 'For mentors'}
          title={vi ? 'Chia sẻ kiến thức, nhận thu nhập' : 'Share what you know, get paid'}
        />
        <div className="grid gap-6 sm:grid-cols-3">
          {mentorSteps.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="border-border p-6">
                <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 style={{ fontWeight: 600 }}>{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1240px] px-5 pb-20">
        <div className="overflow-hidden rounded-3xl bg-navy px-8 py-14 text-center text-white sm:px-14">
          <h2 className="text-white" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700 }}>
            {vi ? 'Sẵn sàng bắt đầu?' : 'Ready to get started?'}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            {vi
              ? 'Tìm mentor phù hợp và đặt buổi học đầu tiên được bảo vệ bằng ký quỹ ngay hôm nay.'
              : 'Find your mentor and book your first escrow-protected session today.'}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/mentors')}>{vi ? 'Tìm mentor' : 'Find a mentor'}</Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => navigate('/become-a-mentor')}
            >
              {vi ? 'Trở thành mentor' : 'Become a mentor'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
