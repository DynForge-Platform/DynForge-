import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  Copy,
  Check,
  Mail,
  ArrowRight,
  ExternalLink,
  Printer,
  Sparkles,
  Lock,
  Scale,
  RefreshCw,
  Wallet,
  AlertTriangle,
  GraduationCap,
  Award,
  BookOpen,
  LifeBuoy,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { GsapCounter } from '../components/GsapCounter';
import { MouseFollowLight } from '../components/MouseFollowLight';
import { DynForgeEmblem } from '../components/Logo';
import { toast } from 'sonner';

interface EscrowLocationState {
  mentor?: string;
  amount?: number;
  day?: number;
  month?: number;
  year?: number;
  slot?: string;
  duration?: number;
  bookingId?: string;
  roomId?: string;
  courseCode?: string;
  courseName?: string;
  mentorAvatar?: string;
  mentorUniversity?: string;
}

export function EscrowStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const isVi = lang === 'vi';

  const now = new Date();
  const state: EscrowLocationState = (location.state as EscrowLocationState) ?? {
    mentor: 'TS. Trần Anh Tuấn',
    amount: 350000,
    day: now.getDate() + 2,
    month: now.getMonth(),
    year: now.getFullYear(),
    slot: '08:00',
    duration: 90,
    bookingId: 'DF-2026-8866',
    courseCode: 'CS501',
    courseName: 'Thuật Toán Nâng Cao & Tối Ưu Hóa',
    mentorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    mentorUniversity: 'Đại Học FPT TP.HCM (FPTU-HCM)',
  };

  const bookingId = state.bookingId || 'DF-2026-8866';
  const escrowId = 'ESC-' + (state.bookingId ? state.bookingId.replace(/[^0-9]/g, '') : '998842');
  const mentorName = state.mentor || 'TS. Trần Anh Tuấn';
  const courseCode = state.courseCode || 'CS501';
  const courseName = state.courseName || 'Thuật Toán Nâng Cao & Tối Ưu Hóa';
  const durationMin = state.duration || 90;
  const amount = state.amount || 350000;
  const meetingUrl = `https://meet.jit.si/${state.roomId?.trim() ? state.roomId.trim() : `DynForge-${bookingId}`}`;
  const studentEmail = user?.email || 'kimcot098@gmail.com';

  // Compute session date display
  const sessionYear = state.year ?? now.getFullYear();
  const sessionMonth = state.month ?? now.getMonth();
  const sessionDay = state.day ?? now.getDate() + 2;
  const sessionDateObj = new Date(sessionYear, sessionMonth, sessionDay);

  const formattedDate = sessionDateObj.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Calculate end slot time
  const startHourMin = state.slot || '08:00';
  const [sHour, sMin] = startHourMin.split(':').map((v) => parseInt(v, 10) || 0);
  const endMinutesTotal = sHour * 60 + sMin + durationMin;
  const eHour = Math.floor(endMinutesTotal / 60) % 24;
  const eMin = endMinutesTotal % 60;
  const endHourMin = `${String(eHour).padStart(2, '0')}:${String(eMin).padStart(2, '0')}`;
  const formattedTimeRange = `${startHourMin} – ${endHourMin} (GMT+7)`;

  // Fire celebratory confetti on mount
  useEffect(() => {
    import('canvas-confetti')
      .then((m) => {
        const conf = m.default || m;
        conf({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#06b6d4', '#3b82f6', '#10b981', '#fbbf24', '#a855f7'],
        });
      })
      .catch(() => {});
  }, []);

  const handleCopyEscrowId = () => {
    navigator.clipboard.writeText(escrowId);
    setCopied(true);
    toast.success(isVi ? 'Đã sao chép mã hợp đồng Escrow!' : 'Escrow contract ID copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Google Calendar Link generator
  const googleCalendarUrl = () => {
    const title = encodeURIComponent(`[DynForge] ${courseCode}: ${courseName} (Mentor ${mentorName})`);
    const details = encodeURIComponent(
      `Lớp học 1-on-1 trên nền tảng DynForge.\nMentor phụ trách: ${mentorName}\nPhòng học trực tuyến: ${meetingUrl}\nMã lịch hẹn: #${bookingId}\nMã ký quỹ Escrow: #${escrowId}\n(Được bảo vệ 100% bởi Quỹ Ký Quỹ Escrow DynForge)`
    );
    const startIso = `${sessionYear}${String(sessionMonth + 1).padStart(2, '0')}${String(sessionDay).padStart(2, '0')}T${String(sHour).padStart(2, '0')}${String(sMin).padStart(2, '0')}00`;
    const endIso = `${sessionYear}${String(sessionMonth + 1).padStart(2, '0')}${String(sessionDay).padStart(2, '0')}T${String(eHour).padStart(2, '0')}${String(eMin).padStart(2, '0')}00`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${encodeURIComponent(meetingUrl)}&dates=${startIso}/${endIso}`;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-transparent text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 py-12 px-4 sm:px-6 lg:px-8">
      {/* ── High-Performance Interactive Mouse-Following Light Effect ── */}
      <MouseFollowLight size={300} />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Hero Celebratory Header with Animations */}
        <div className="text-center mb-10 relative">
          <div className="relative inline-flex items-center justify-center mb-5 animate-fade-rise">
            <div className="relative size-20 sm:size-24 flex items-center justify-center drop-shadow-[0_0_35px_rgba(6,182,212,0.6)]">
              <DynForgeEmblem className="size-full" />
              <div className="absolute -bottom-1 -right-1 size-7 sm:size-8 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-slate-950 shadow-lg z-10">
                <Check className="size-4 sm:size-4.5 stroke-[3]" />
              </div>
            </div>
          </div>

          <div className="animate-fade-rise mb-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md">
              <Sparkles className="size-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              {isVi ? 'ĐẶT LỊCH & THANH TOÁN KÝ QUỸ THÀNH CÔNG' : 'BOOKING & ESCROW PAYMENT CONFIRMED'}
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight mb-3 animate-fade-rise drop-shadow-lg"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {isVi ? 'Hợp Đồng Ký Quỹ' : 'DynForge Escrow'}{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-400 bg-clip-text text-transparent italic">
              {isVi ? 'Đã Khóa An Toàn' : 'Guaranteed'}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300/90 text-sm sm:text-base leading-relaxed animate-fade-rise-delay font-normal">
            {isVi
              ? 'Học phí của bạn hiện đang được lưu ký an toàn trong Quỹ Ký Quỹ Độc Lập. Giảng viên chỉ nhận được tiền khi bạn xác nhận buổi học đã diễn ra trọn vẹn và đạt yêu cầu.'
              : 'Your session fee is held securely in the independent DynForge Escrow Vault. Funds are only released to the mentor after you confirm successful completion.'}
          </p>
        </div>

        {/* Live Email Confirmation Notification Card */}
        <div className="mb-8 rounded-3xl bg-[#090f1e]/80 border border-white/10 p-5 sm:p-6 backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] animate-fade-rise-delay hover:border-cyan-500/30 transition-all duration-300">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Mail className="size-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm sm:text-base">
                  {isVi ? 'Email xác nhận chi tiết đã được gửi' : 'Detailed confirmation email dispatched'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                  ✓ {isVi ? 'ĐÃ GỬI' : 'DELIVERED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isVi
                  ? `Lịch học GMT+7, mã phòng Jitsi Meet và hướng dẫn đã được gửi tới hộp thư `
                  : `GMT+7 session time, classroom link, and instructions were sent to `}
                <strong className="text-cyan-300 font-semibold">{studentEmail}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs border-white/10 bg-white/5 text-slate-200 hover:bg-white/15 hover:text-white rounded-xl flex items-center gap-2 px-4 py-2 transition-all"
            >
              <Printer className="size-3.5" />
              {isVi ? 'In biên lai' : 'Print Receipt'}
            </Button>
          </div>
        </div>

        {/* 3-Stage Escrow Timeline Pipeline */}
        <div className="mb-10 rounded-3xl bg-[#090f1e]/80 border border-white/10 p-6 sm:p-7 backdrop-blur-2xl shadow-2xl animate-fade-rise-delay">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
              <Lock className="size-3.5" />
              {isVi ? 'TIẾN TRÌNH KÝ QUỸ 3 BƯỚC MINH BẠCH' : '3-STEP TRANSPARENT ESCROW PIPELINE'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {isVi ? 'Giai đoạn 1/3: Đã khóa tiền' : 'Stage 1/3: Vault Locked'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {/* Step 1: Active */}
            <div className="relative rounded-2xl bg-gradient-to-b from-cyan-950/60 via-slate-900/80 to-[#090f1e]/90 border-2 border-cyan-500/60 p-5 shadow-[0_0_25px_rgba(6,182,212,0.2)] hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between mb-3">
                <span className="size-8 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                  1
                </span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  ✓ {isVi ? 'ĐÃ KHÓA' : 'LOCKED'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">
                {isVi ? 'Khóa Học Phí Ký Quỹ' : 'Escrow Vault Locked'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isVi
                  ? 'Tiền được bảo lưu an toàn trong Smart Escrow Vault, tách biệt và được DynForge bảo vệ 100%.'
                  : 'Funds securely locked in the isolated smart escrow vault under DynForge custody.'}
              </p>
            </div>

            {/* Step 2: Next */}
            <div className="relative rounded-2xl bg-[#090f1e]/60 border border-white/10 p-5 hover:border-white/20 hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="size-8 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-white/10">
                  2
                </span>
                <span className="text-[11px] font-medium text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  ⏳ {isVi ? 'SẮP DIỄN RA' : 'UPCOMING'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1.5">
                {isVi ? 'Tham Gia Buổi Học 1-on-1' : 'Attend 1-on-1 Session'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isVi
                  ? 'Gặp Mentor qua phòng học trực tuyến Jitsi Meet theo đúng khung giờ hẹn.'
                  : 'Connect with your verified mentor via direct video classroom at the scheduled slot.'}
              </p>
            </div>

            {/* Step 3: Pending */}
            <div className="relative rounded-2xl bg-[#090f1e]/60 border border-white/10 p-5 hover:border-white/20 hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="size-8 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center border border-white/10">
                  3
                </span>
                <span className="text-[11px] font-medium text-slate-500 bg-white/5 px-2.5 py-0.5 rounded-full">
                  {isVi ? 'BƯỚC CUỐI' : 'FINAL'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-300 mb-1.5">
                {isVi ? 'Xác Nhận & Giải Ngân' : 'Confirm & Release Payout'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isVi
                  ? 'Bạn bấm duyệt để chuyển học phí cho Mentor, hoặc mở khiếu nại (Dispute) trong 24h nếu có sự cố.'
                  : 'You release payment to the mentor, or file a dispute within 24h if any issue arises.'}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Bento Grid: Dossier & Protections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 animate-fade-rise-delay-2">
          {/* Left Column: Escrow Contract Dossier (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl bg-[#090f1e]/85 border border-white/10 hover:border-cyan-500/40 p-6 sm:p-7 backdrop-blur-2xl shadow-2xl relative overflow-hidden transition-all duration-300">
              {/* Top Accent Ribbon */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

              {/* Dossier Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-white/10">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    {isVi ? 'HỒ SƠ HỢP ĐỒNG KÝ QUỸ ĐIỆN TỬ' : 'DIGITAL ESCROW CONTRACT DOSSIER'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm sm:text-base font-bold text-white">
                      #{escrowId}
                    </span>
                    <button
                      onClick={handleCopyEscrowId}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
                      title={isVi ? 'Sao chép mã' : 'Copy ID'}
                    >
                      {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">{isVi ? 'Mã đặt lịch' : 'Booking Code'}</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">#{bookingId}</span>
                </div>
              </div>

              {/* Mentor Identity Badge */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-6 flex items-center gap-4 hover:border-white/20 transition-all">
                <div className="relative">
                  <img
                    src={state.mentorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={mentorName}
                    className="size-14 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-cyan-500 border-2 border-slate-950 flex items-center justify-center text-slate-950" title="Verified Mentor">
                    <Award className="size-3" />
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base truncate">{mentorName}</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                      ✓ {isVi ? 'Mentor Đã Xác Minh' : 'Verified'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-1">
                    <GraduationCap className="size-3.5 text-cyan-400 shrink-0" />
                    {state.mentorUniversity || 'Đại Học FPT TP.HCM (FPTU-HCM)'}
                  </p>
                </div>
              </div>

              {/* Session Details Matrix */}
              <div className="space-y-3.5 mb-6 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400 flex items-center gap-2">
                    <BookOpen className="size-4 text-cyan-400" />
                    {isVi ? 'Môn học đăng ký:' : 'Course:'}
                  </span>
                  <span className="font-bold text-white text-right">
                    <span className="text-cyan-400 font-mono mr-1.5">{courseCode}</span>
                    {courseName}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Calendar className="size-4 text-cyan-400" />
                    {isVi ? 'Ngày diễn ra:' : 'Date:'}
                  </span>
                  <span className="font-bold text-white capitalize">{formattedDate}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Clock className="size-4 text-cyan-400" />
                    {isVi ? 'Khung giờ học:' : 'Time slot:'}
                  </span>
                  <span className="inline-block px-3 py-1 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs shadow-inner">
                    {formattedTimeRange}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Video className="size-4 text-cyan-400" />
                    {isVi ? 'Hình thức học:' : 'Format:'}
                  </span>
                  <span className="font-medium text-slate-200">
                    {isVi ? `1-on-1 Trực tuyến (${durationMin} phút)` : `1-on-1 Virtual (${durationMin} mins)`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3.5 bg-white/[0.04] px-4 rounded-2xl border border-white/10">
                  <div>
                    <span className="text-xs text-slate-400 block">{isVi ? 'Học phí ký quỹ' : 'Escrow Deposit'}</span>
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                      ✓ {isVi ? 'Bảo lưu 100% trong quỹ' : '100% Guaranteed in Vault'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      <GsapCounter targetValue={amount} suffix=" ₫" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Primary Action: Enter Classroom */}
              <div className="space-y-3">
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-base flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Video className="size-5" />
                  <span>{isVi ? '🚀 Vào Phòng Học Jitsi Meet Trực Tuyến' : '🚀 Enter Jitsi Meet Classroom'}</span>
                  <ExternalLink className="size-4 opacity-80" />
                </a>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={googleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Calendar className="size-4 text-cyan-400" />
                    <span>{isVi ? 'Thêm vào Google Calendar' : 'Add to Google Calendar'}</span>
                  </a>

                  <button
                    onClick={handleCopyEscrowId}
                    className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Copy className="size-4 text-cyan-400" />
                    <span>{isVi ? 'Sao chép mã hợp đồng' : 'Copy Escrow Hash'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3-Layer Escrow Guarantee & Student Checklist (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 3-Layer Protection Card */}
            <div className="rounded-3xl bg-[#090f1e]/85 border border-white/10 hover:border-cyan-500/40 p-6 backdrop-blur-2xl shadow-2xl transition-all duration-300">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <ShieldCheck className="size-5 text-cyan-400" />
                {isVi ? 'Cam Kết Bảo Vệ 3 Lớp Từ DynForge' : 'DynForge 3-Layer Guarantee'}
              </h3>

              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3 hover:border-white/20 transition-all">
                  <div className="size-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">
                      {isVi ? '1. Bảo Lưu An Toàn (Safe Custody)' : '1. Safe Custody'}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isVi
                        ? 'Mentor tuyệt đối không thể rút học phí trước khi buổi học kết thúc và bạn bấm duyệt.'
                        : 'Mentors cannot withdraw funds until the session completes and you confirm.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3 hover:border-white/20 transition-all">
                  <div className="size-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Scale className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">
                      {isVi ? '2. Cơ Chế Khiếu Nại 24h (Dispute Window)' : '2. 24h Dispute Window'}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isVi
                        ? 'Trong 24 giờ sau giờ học, bạn có quyền mở khiếu nại nếu Mentor vắng mặt hoặc không đúng cam kết.'
                        : 'File a dispute within 24h if the mentor fails to attend or breaches expectations.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3 hover:border-white/20 transition-all">
                  <div className="size-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCw className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">
                      {isVi ? '3. Hoàn Tiền 100% Nhanh Chóng' : '3. 100% Fast Refund'}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isVi
                        ? 'Ban Trọng tài DynForge sẽ hoàn trả 100% học phí về ví của bạn ngay khi khiếu nại được xác thực.'
                        : 'DynForge Arbitration refunds 100% of the deposit directly to your wallet upon verification.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preparation Checklist */}
            <div className="rounded-3xl bg-[#090f1e]/85 border border-white/10 hover:border-cyan-500/40 p-6 backdrop-blur-2xl shadow-2xl transition-all duration-300">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                <CheckCircle2 className="size-5 text-emerald-400" />
                {isVi ? 'Checklist Chuẩn Bị Cho Buổi Học' : 'Student Preparation Checklist'}
              </h3>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                    1
                  </span>
                  <span>
                    {isVi
                      ? 'Có mặt trong phòng học Jitsi trước giờ bắt đầu 5 phút để kiểm tra camera và mic.'
                      : 'Join the Jitsi classroom 5 mins early to test audio, camera, and network.'}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                    2
                  </span>
                  <span>
                    {isVi
                      ? 'Chuẩn bị sẵn câu hỏi, bài tập hoặc mã nguồn cần giải đáp để tối ưu 90 phút học.'
                      : 'Prepare questions, code snippets, or study material to make the most of 90 mins.'}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                    3
                  </span>
                  <span>
                    {isVi
                      ? 'Sau khi kết thúc, vào Bảng điều khiển sinh viên để bấm "Xác nhận hoàn thành".'
                      : 'After class, visit your Student Dashboard and click "Confirm Completion".'}
                  </span>
                </li>
              </ul>

              {/* Emergency Support Link */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <LifeBuoy className="size-4 text-cyan-400" />
                  {isVi ? 'Cần hỗ trợ khẩn cấp?' : 'Need urgent help?'}
                </span>
                <Link
                  to="/support/contact"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                >
                  {isVi ? 'Trợ lý Trọng tài 24/7 →' : '24/7 Support →'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Hub */}
        <div className="rounded-3xl bg-[#090f1e]/80 border border-white/10 p-6 backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl animate-fade-rise-delay-2">
          <div>
            <h4 className="font-bold text-white text-base">
              {isVi ? 'Sẵn sàng cho các buổi học tiếp theo?' : 'Ready for your next learning session?'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isVi
                ? 'Bạn có thể theo dõi tiến độ, ví ký quỹ và lịch học tại Bảng điều khiển sinh viên.'
                : 'Track your schedule, escrow ledger, and active sessions in your student dashboard.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => navigate('/dashboard')}
              className="flex-1 sm:flex-initial py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all"
            >
              <span>{isVi ? 'Vào Bảng Điều Khiển Của Tôi' : 'Go to My Dashboard'}</span>
              <ArrowRight className="size-4" />
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/wallet')}
              className="py-3 px-5 rounded-xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/15 hover:text-white text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Wallet className="size-4 text-cyan-400" />
              <span>{isVi ? 'Ví Ký Quỹ' : 'Escrow Wallet'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/mentors')}
              className="py-3 px-5 rounded-xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/15 hover:text-white text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>{isVi ? 'Khám Phá Thêm Mentor' : 'Browse Mentors'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
