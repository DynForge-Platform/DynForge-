import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CalendarX, CreditCard, RefreshCcw, BadgeCheck, Lock, Monitor,
  Clock, Mail, ExternalLink, CheckCircle2, LifeBuoy,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '../components/ui/accordion';
import { PageHeader } from '../components/common';
import { useLanguage } from '../context/LanguageContext';

export function ContactSupport() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [submitted, setSubmitted] = useState(false);
  const [ticketId] = useState(`TKT-${Math.floor(100000 + Math.random() * 900000)}`);
  const [category, setCategory] = useState('');

  const categories = [
    { icon: CalendarX, label: vi ? 'Vấn đề đặt lịch' : 'Booking issue', value: 'booking' },
    { icon: CreditCard, label: vi ? 'Thanh toán / Ký quỹ (Escrow)' : 'Payment / escrow', value: 'payment' },
    { icon: RefreshCcw, label: vi ? 'Yêu cầu hoàn tiền' : 'Refund request', value: 'refund' },
    { icon: BadgeCheck, label: vi ? 'Xác minh mentor' : 'Mentor verification', value: 'verification' },
    { icon: Lock, label: vi ? 'Truy cập tài khoản' : 'Account access', value: 'account' },
    { icon: Monitor, label: vi ? 'Lỗi kỹ thuật' : 'Technical issue', value: 'technical' },
  ];

  const faqs = vi ? [
    { q: 'Khi nào tiền của tôi được giải ngân?', a: 'Học phí được giữ trong ký quỹ (Escrow) và giải ngân trong vòng 24 giờ sau khi cả bạn và mentor xác nhận buổi học đã hoàn tất. Nếu bật tự động xác nhận, tiền sẽ tự giải ngân sau 48 giờ.' },
    { q: 'Hoàn tiền hoạt động như thế nào?', a: 'Nếu mentor huỷ hoặc không tham gia, DynForge hoàn tiền đầy đủ trong vòng 3–5 ngày làm việc. Với các tranh chấp, đội ngũ của chúng tôi sẽ xem xét và quyết định hoàn toàn bộ hay một phần dựa trên bằng chứng.' },
    { q: 'Làm sao để mở tranh chấp?', a: 'Vào Bảng điều khiển → Tranh chấp & Khiếu nại → Mở tranh chấp mới. Chọn buổi học liên quan, chọn loại vấn đề và mô tả sự việc. Đội ngũ của chúng tôi sẽ phản hồi trong vòng 48 giờ.' },
    { q: 'Làm sao để xác minh tài khoản mentor?', a: 'Vào Bảng điều khiển Mentor → Xác minh. Tải lên bảng điểm hoặc minh chứng chuyên môn, xác minh email trường và đặt một cuộc gọi xác minh ngắn. Việc duyệt mất 2–3 ngày làm việc.' },
  ] : [
    { q: 'When will my payment be released?', a: 'Payments are held in escrow and released within 24 hours after both you and the mentor confirm the session is completed. If auto-confirmation is enabled, funds release automatically after 48 hours.' },
    { q: 'How do refunds work?', a: 'If a mentor cancels or fails to attend, DynForge processes a full refund within 3–5 business days. For disputes, our team reviews the case and decides on full or partial refund based on the evidence.' },
    { q: 'How do I open a dispute?', a: 'Go to Dashboard → Disputes & Complaints → Open New Dispute. Select the related session, choose the issue type, and describe the problem. Our team will respond within 48 hours.' },
    { q: 'How do I verify my mentor account?', a: 'Go to your Mentor Dashboard → Verification. Upload your transcript or proof of expertise, verify your university email, and schedule a short verification call. Approval takes 2–3 business days.' },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-[#020B18] min-h-screen text-slate-100 flex items-center justify-center p-6">
        <div className="mx-auto max-w-[640px] text-center">
          <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="size-9" />
          </span>
          <h1 className="text-3xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>{vi ? 'Đã gửi yêu cầu hỗ trợ' : 'Support request submitted'}</h1>
          <p className="mt-3 text-slate-400 text-sm">
            {vi ? 'Đội ngũ của chúng tôi sẽ xem xét yêu cầu và phản hồi trong vòng 24 giờ.' : 'Our team will review your request and respond within 24 hours.'}
          </p>
          <Card className="mx-auto mt-6 max-w-sm border border-white/10 bg-[#090f1e]/90 p-5 text-left rounded-2xl shadow-2xl">
            <p className="text-xs text-slate-400">{vi ? 'Mã yêu cầu' : 'Ticket ID'}</p>
            <p className="font-bold text-cyan-300 text-xl">{ticketId}</p>
            <p className="mt-2 text-xs text-slate-400">
              {vi ? 'Email xác nhận đã được gửi vào hộp thư của bạn.' : 'A confirmation email has been sent to your inbox.'}
            </p>
          </Card>
          <Button onClick={() => navigate('/dashboard')} className="mt-8 bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-8 py-3 rounded-xl">
            {vi ? 'Về Bảng điều khiển' : 'Return to Dashboard'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#020B18] min-h-screen text-slate-100">
      <div className="mx-auto max-w-[1240px] px-5 py-6">
        <PageHeader
          eyebrow={vi ? 'TRUNG TÂM HỖ TRỢ DYNFORGE' : 'DYNFORGE SUPPORT CENTER'}
          title={vi ? 'Chúng tôi có thể' : 'How can we'}
          highlightWord={vi ? 'giúp gì cho bạn?' : 'help you?'}
          subtitle={vi ? 'Gửi yêu cầu hỗ trợ hoặc xem giải đáp cho các câu hỏi thường gặp về đặt lịch, thanh toán và bảo vệ ký quỹ.' : 'Submit a support ticket or explore answers to common questions about bookings, payments, and escrow protection.'}
        />

        <div className="grid gap-8 lg:grid-cols-12 mt-6">
          {/* Ticket Form */}
          <div className="space-y-6 lg:col-span-7">
            <Card className="border border-white/10 bg-[#090f1e]/90 backdrop-blur-xl p-8 text-slate-100 shadow-2xl rounded-2xl">
              <h2 className="mb-2 text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {vi ? 'Gửi yêu cầu hỗ trợ' : 'Submit a Support Ticket'}
              </h2>
              <p className="mb-6 text-xs text-slate-400">{vi ? 'Điền thông tin bên dưới, đội ngũ của chúng tôi sẽ phản hồi trong vòng 24 giờ.' : 'Fill in the details below and our team will get back to you within 24 hours.'}</p>

              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">{vi ? 'Họ và tên' : 'Your Name'}</Label>
                    <Input placeholder={vi ? 'Nguyễn Văn A' : 'John Doe'} className="bg-[#020b18] border-white/10 text-white placeholder:text-slate-500 rounded-xl" required />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">{vi ? 'Email của bạn' : 'Your Email'}</Label>
                    <Input type="email" placeholder="student@university.edu.vn" className="bg-[#020b18] border-white/10 text-white placeholder:text-slate-500 rounded-xl" required />
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">{vi ? 'Loại vấn đề' : 'Category'}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-[#020b18] border-white/10 text-white rounded-xl"><SelectValue placeholder={vi ? 'Chọn chủ đề' : 'Select topic'} /></SelectTrigger>
                    <SelectContent className="bg-[#090f1e] border-white/10 text-white">
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">{vi ? 'Tiêu đề' : 'Subject'}</Label>
                  <Input placeholder={vi ? 'Mô tả ngắn gọn vấn đề của bạn' : 'Brief description of your issue'} className="bg-[#020b18] border-white/10 text-white placeholder:text-slate-500 rounded-xl" required />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">{vi ? 'Nội dung / Chi tiết vấn đề' : 'Message / Issue Details'}</Label>
                  <Textarea placeholder={vi ? 'Kèm mã đặt lịch, tên mentor hoặc chi tiết lỗi…' : 'Include booking code, mentor name, or error details...'} rows={4} className="bg-[#020b18] border-white/10 text-white placeholder:text-slate-500 rounded-xl" required />
                </div>

                <Button type="submit" className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl shadow-xl text-base">
                  {vi ? 'Gửi yêu cầu' : 'Submit Ticket'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Sidebar & FAQs */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="border border-white/10 bg-[#090f1e]/90 backdrop-blur-xl p-6 text-slate-100 shadow-2xl rounded-2xl">
              <h2 className="mb-4 text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {vi ? 'Câu hỏi thường gặp' : 'Frequently Asked Questions'}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-white/10">
                    <AccordionTrigger className="text-sm text-slate-200 hover:text-cyan-300">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-400 leading-relaxed">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>

            <Card className="border border-white/10 bg-[#090f1e]/90 backdrop-blur-xl p-6 text-slate-100 shadow-2xl rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <LifeBuoy className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{vi ? 'Cần hỗ trợ gấp?' : 'Need Urgent Help?'}</h3>
                  <p className="text-xs text-slate-400">{vi ? 'Gửi email trực tiếp đến bộ phận hỗ trợ tại ' : 'Email our support desk directly at '}<a href="mailto:dynforge.edu.hcmcity@gmail.com" className="text-cyan-400 hover:underline">dynforge.edu.hcmcity@gmail.com</a></p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
