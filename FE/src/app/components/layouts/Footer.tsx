import { useState } from 'react';
import { Link } from 'react-router';
import {
  Megaphone, BarChart3, Users, Star, X, Check, Mail, Phone, ArrowRight,
} from 'lucide-react';
import { Logo } from '../Logo';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';


type BillingCycle = 'monthly' | 'yearly';

interface AdPlan {
  name: string;
  monthlyPrice: number | null; // null = custom
  color: string;
  badge: string | null;
  badgeColor: string;
  description: string;
  features: string[];
  cta: string;
  highlight: boolean;
}

const adPlans: AdPlan[] = [
  {
    name: 'Starter',
    monthlyPrice: 2500000,
    color: 'border-border',
    badge: null,
    badgeColor: '',
    description: 'Phù hợp cho thương hiệu nhỏ và startup muốn tiếp cận thị trường sinh viên.',
    features: [
      'Banner quảng cáo trên trang Tìm gia sư',
      'Tối đa 10.000 lượt hiển thị / tháng',
      'Link trực tiếp đến landing page của bạn',
      'Báo cáo hiệu suất hàng tháng',
    ],
    cta: 'Bắt đầu ngay',
    highlight: false,
  },
  {
    name: 'Growth',
    monthlyPrice: 6000000,
    color: 'border-primary',
    badge: 'Phổ biến nhất',
    badgeColor: 'bg-primary',
    description: 'Lý tưởng cho thương hiệu muốn tiếp cận sinh viên FPTU theo quy mô lớn.',
    features: [
      'Banner + thẻ tài trợ in-feed',
      'Tối đa 50.000 lượt hiển thị / tháng',
      'Vị trí nổi bật trên trang chủ',
      'Badge tài trợ trên hồ sơ gia sư',
      'Dashboard phân tích 2 tuần / lần',
      'Account manager riêng',
    ],
    cta: 'Bắt đầu ngay',
    highlight: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    color: 'border-navy',
    badge: 'Doanh nghiệp lớn',
    badgeColor: 'bg-navy',
    description: 'Tích hợp toàn nền tảng dành cho đối tác doanh nghiệp và trường đại học.',
    features: [
      'Tất cả tính năng Growth',
      'Tài nguyên & nội dung được tài trợ',
      'Sự kiện mentor đồng thương hiệu',
      'Đặt quảng cáo trong email newsletter',
      'Chiến lược campaign tùy chỉnh',
      'Hỗ trợ ưu tiên & SLA',
    ],
    cta: 'Liên hệ tư vấn',
    highlight: false,
  },
];

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

const stats = [
  { icon: Users, value: '12,000+', label: 'Monthly active students' },
  { icon: BarChart3, value: '85%', label: 'Engagement rate on ads' },
  { icon: Star, value: '4.9/5', label: 'Partner satisfaction' },
  { icon: Megaphone, value: '40+', label: 'Universities reached' },
];

function PartnershipModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'plans' | 'contact'>('plans');
  const [selectedPlan, setSelectedPlan] = useState('Growth');
  const [billing, setBilling] = useState<BillingCycle>('monthly');

  const getPrice = (plan: AdPlan) => {
    if (!plan.monthlyPrice) return null;
    return billing === 'yearly'
      ? Math.round(plan.monthlyPrice * 10) // 10 tháng = 2 tháng free
      : plan.monthlyPrice;
  };

  const getPerMonth = (plan: AdPlan) => {
    if (!plan.monthlyPrice) return null;
    return billing === 'yearly'
      ? Math.round(plan.monthlyPrice * 10 / 12)
      : plan.monthlyPrice;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Yêu cầu hợp tác đã được gửi! Chúng tôi sẽ liên hệ trong vòng 1–2 ngày làm việc.");
    onClose();
    setTimeout(() => setStep('plans'), 300);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0" aria-describedby={undefined}>
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-lg border-b border-border bg-white px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Megaphone className="size-4 text-primary" />
            </span>
            {step === 'plans' ? 'Quảng cáo & Hợp tác với GRADORA' : `Đăng ký gói ${selectedPlan}`}
          </DialogTitle>
        </div>

        <div className="px-6 pb-6 pt-5">
          {step === 'plans' ? (
            <div className="space-y-5">
              {/* Stats banner */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent to-pale-blue p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Tiếp cận <strong className="text-foreground">12.000+ sinh viên</strong> đang chủ động tìm kiếm tài nguyên học thuật, công cụ và cơ hội nghề nghiệp.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {stats.map(({ icon: Icon, value, label }) => (
                    <div key={label} className="flex flex-col items-center rounded-xl bg-white/80 px-2 py-3 text-center backdrop-blur">
                      <Icon className="mb-1 size-4 text-primary" />
                      <p style={{ fontWeight: 700, lineHeight: 1.1 }}>{value}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`rounded-l-full border px-5 py-2 text-sm transition-colors ${billing === 'monthly' ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:bg-accent'}`}
                  style={{ fontWeight: 500 }}
                >
                  Theo tháng
                </button>
                <button
                  onClick={() => setBilling('yearly')}
                  className={`relative rounded-r-full border px-5 py-2 text-sm transition-colors ${billing === 'yearly' ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:bg-accent'}`}
                  style={{ fontWeight: 500 }}
                >
                  Theo năm
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${billing === 'yearly' ? 'bg-white/20 text-white' : 'bg-success/15 text-success'}`} style={{ fontWeight: 600 }}>
                    -17%
                  </span>
                </button>
              </div>
              {billing === 'yearly' && (
                <p className="text-center text-xs text-success" style={{ fontWeight: 500 }}>
                  🎉 Thanh toán năm = 10 tháng — tặng 2 tháng miễn phí
                </p>
              )}

              {/* Plan cards */}
              <div className="grid gap-3 sm:grid-cols-3">
                {adPlans.map((plan) => {
                  const price = getPrice(plan);
                  const perMonth = getPerMonth(plan);
                  const selected = selectedPlan === plan.name;
                  return (
                    <div
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan.name)}
                      className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-5 transition-all ${plan.color} ${selected ? 'shadow-lg ring-2 ring-primary/30' : 'bg-white hover:border-primary/50'} ${plan.highlight && !selected ? 'bg-primary/3' : ''}`}
                    >
                      {/* Badge */}
                      {plan.badge && (
                        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-xs text-white ${plan.badgeColor}`} style={{ fontWeight: 600 }}>
                          {plan.badge}
                        </span>
                      )}

                      {/* Selected tick */}
                      {selected && (
                        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="size-3" />
                        </span>
                      )}

                      {/* Plan name */}
                      <p style={{ fontWeight: 700, fontSize: '1rem' }}>{plan.name}</p>

                      {/* Price */}
                      <div className="mt-2 min-h-[3.5rem]">
                        {price !== null ? (
                          <>
                            {billing === 'yearly' && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatVND(plan.monthlyPrice! * 12)}/năm
                              </p>
                            )}
                            <div className="flex items-baseline gap-1">
                              <span style={{ fontSize: '1.375rem', fontWeight: 800, lineHeight: 1.1 }}>
                                {formatVND(price)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                /{billing === 'yearly' ? 'năm' : 'tháng'}
                              </span>
                            </div>
                            {billing === 'yearly' && perMonth !== null && (
                              <p className="text-xs text-success" style={{ fontWeight: 500 }}>
                                ~ {formatVND(perMonth)}/tháng
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="flex items-baseline">
                            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>Liên hệ</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="mt-2 text-xs text-muted-foreground leading-snug">{plan.description}</p>

                      {/* Features */}
                      <ul className="mt-3 flex-1 space-y-1.5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Check className="mt-0.5 size-3 shrink-0 text-success" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Footer row */}
              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Đã chọn: <strong className="text-foreground">{selectedPlan}</strong>
                  {billing === 'yearly' && (
                    <span className="ml-1.5 rounded-full bg-success/15 px-2 py-0.5 text-success" style={{ fontWeight: 500 }}>
                      Thanh toán năm — tiết kiệm 2 tháng
                    </span>
                  )}
                  <span className="ml-1">· Đã bao gồm kiểm duyệt thương hiệu & nhắm mục tiêu FPTU.</span>
                </p>
                <Button onClick={() => setStep('contact')} className="shrink-0 gap-1.5">
                  Tiếp tục <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {/* Selected plan reminder */}
              <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                <div>
                  Gói đã chọn: <strong>{selectedPlan}</strong>
                  <span className="ml-2 text-muted-foreground">({billing === 'yearly' ? 'Thanh toán năm' : 'Thanh toán tháng'})</span>
                  {(() => {
                    const plan = adPlans.find((p) => p.name === selectedPlan);
                    const price = plan ? getPrice(plan) : null;
                    return price ? <span className="ml-2 text-primary" style={{ fontWeight: 600 }}>{formatVND(price)}/{billing === 'yearly' ? 'năm' : 'tháng'}</span> : null;
                  })()}
                </div>
                <button type="button" onClick={() => setStep('plans')} className="text-xs text-primary hover:underline">
                  Đổi gói
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block">Tên công ty / thương hiệu</Label>
                  <Input placeholder="vd: FPT Software" className="bg-input-background" required />
                </div>
                <div>
                  <Label className="mb-1.5 block">Người liên hệ</Label>
                  <Input placeholder="Họ và tên" className="bg-input-background" required />
                </div>
                <div>
                  <Label className="mb-1.5 block">Email công ty</Label>
                  <Input type="email" placeholder="you@company.com" className="bg-input-background" required />
                </div>
                <div>
                  <Label className="mb-1.5 block">Số điện thoại</Label>
                  <Input type="tel" placeholder="+84 ..." className="bg-input-background" />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block">Mục tiêu chiến dịch</Label>
                <Textarea placeholder="Mô tả về thương hiệu, đối tượng mục tiêu và mục tiêu bạn muốn đạt được..." rows={3} />
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-accent/60 px-4 py-3 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0 text-primary" />
                Đội ngũ hợp tác sẽ phản hồi trong vòng 1–2 ngày làm việc với đề xuất riêng cho bạn.
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={() => setStep('plans')}>Quay lại</Button>
                <Button type="submit">Gửi yêu cầu hợp tác</Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Footer() {
  const [showPartner, setShowPartner] = useState(false);
  const { T } = useLanguage();

  const dynamicColumns = [
    {
      title: T.platform,
      links: [
        { label: T.findMentors, to: '/mentors' },
        { label: T.becomeMentor, to: '/become-a-mentor' },
        { label: T.resources, to: '/resources' },
        { label: T.about, to: '/about' },
      ],
    },
    {
      title: T.trustSafety,
      links: [
        { label: T.escrowProtection, to: '/about' },
        { label: T.mentorVerificationLink, to: '/become-a-mentor' },
        { label: T.disputeResolution, to: '/dashboard' },
        { label: T.communityGuidelines, to: '/about' },
      ],
    },
    {
      title: T.company,
      links: [
        { label: T.aboutGradora, to: '/about' },
        { label: T.careers, to: '/about' },
        { label: T.contact, to: '/support/contact' },
        { label: T.admin, to: '/admin' },
      ],
    },
  ];

  return (
    <>
      {/* Partnership banner */}
      <div className="border-t border-border bg-navy">
        <div className="mx-auto max-w-[1240px] px-5 py-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Megaphone className="size-5 text-white/70" />
                <span className="text-xs text-white/50 uppercase tracking-widest" style={{ fontWeight: 600 }}>
                  {T.footerForBusinesses}
                </span>
              </div>
              <h3 className="text-white" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {T.footerPartnerTitle}
              </h3>
              <p className="mt-1 text-sm text-white/60 max-w-lg">
                {T.footerPartnerDesc}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:shrink-0">
              <Button
                onClick={() => setShowPartner(true)}
                className="bg-white text-navy hover:bg-white/90 gap-2"
              >
                <Megaphone className="size-4" /> {T.viewAdvertisingPlans}
              </Button>
              <p className="text-center text-xs text-white/40">{T.noCommitment}</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-border bg-pale-blue">
        <div className="mx-auto max-w-[1240px] px-5 py-14">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                {T.footerTagline}
              </p>
              <button
                onClick={() => setShowPartner(true)}
                className="mt-4 flex items-center gap-1.5 text-sm text-primary hover:underline"
                style={{ fontWeight: 500 }}
              >
                <Megaphone className="size-3.5" /> {T.partnerWithUs}
              </button>
            </div>
            {dynamicColumns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-3" style={{ fontWeight: 600 }}>
                  {col.title}
                </h4>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
            <span>{T.copyright}</span>
            <span>{T.paymentsSecured}</span>
          </div>
        </div>
      </footer>

      <PartnershipModal open={showPartner} onClose={() => setShowPartner(false)} />
    </>
  );
}
