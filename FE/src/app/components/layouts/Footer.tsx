import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Megaphone, BarChart3, Users, Star, Check, Mail, ArrowRight,
  ShieldCheck, CreditCard, Target,
} from 'lucide-react';
import { Logo } from '../Logo';
import {
  Dialog, DialogContent, DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency } from '../../lib/format';

import {
  getPartnershipConfig,
  submitPartnershipLead,
  type PartnershipConfig,
} from '../../services/partnershipService';

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

function PartnershipModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [step, setStep] = useState<'plans' | 'contact'>('plans');
  const [selectedPlan, setSelectedPlan] = useState('Growth');
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [remoteConfig, setRemoteConfig] = useState<PartnershipConfig | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [goals, setGoals] = useState('');

  // Fetch dynamic config from backend
  useEffect(() => {
    if (open) {
      getPartnershipConfig()
        .then((cfg) => setRemoteConfig(cfg))
        .catch(() => {
          // Fallback to defaults seamlessly
        });
    }
  }, [open]);

  const stats = remoteConfig?.stats?.length
    ? remoteConfig.stats.map((st) => ({
        icon: st.icon === 'Users' ? Users : st.icon === 'BarChart3' ? BarChart3 : st.icon === 'Star' ? Star : Megaphone,
        value: st.value,
        label: vi ? st.labelVi : st.labelEn,
      }))
    : [
        { icon: Users, value: '12,000+', label: vi ? 'Sinh viên hoạt động hằng tháng' : 'Monthly active students' },
        { icon: BarChart3, value: '85%', label: vi ? 'Tỷ lệ tương tác với quảng cáo' : 'Ad engagement rate' },
        { icon: Star, value: '4.9/5', label: vi ? 'Mức hài lòng của đối tác' : 'Partner satisfaction' },
        { icon: Megaphone, value: '40+', label: vi ? 'Trường đại học tiếp cận' : 'Universities reached' },
      ];

  const adPlans: AdPlan[] = remoteConfig?.plans?.length
    ? remoteConfig.plans.filter((p) => p.active !== false).map((p) => ({
        name: p.name,
        monthlyPrice: p.monthlyPrice,
        color: p.color || (p.highlight ? 'border-cyan-500' : 'border-slate-800'),
        badge: vi ? p.badgeVi : p.badgeEn,
        badgeColor: p.badgeColor || (p.highlight ? 'bg-cyan-600' : 'bg-slate-800'),
        description: vi ? p.descriptionVi : p.descriptionEn,
        features: vi ? (p.featuresVi || []) : (p.featuresEn || []),
        cta: vi ? 'Bắt đầu ngay' : 'Get started',
        highlight: p.highlight,
      }))
    : [
        {
          name: 'Starter',
          monthlyPrice: 2500000,
          color: 'border-slate-800',
          badge: null,
          badgeColor: '',
          description: vi
            ? 'Phù hợp cho thương hiệu nhỏ và startup muốn tiếp cận thị trường sinh viên.'
            : 'Ideal for small brands and startups looking to reach university students.',
          features: vi
            ? [
                'Banner quảng cáo trên trang Tìm Mentor',
                'Tối đa 10.000 lượt hiển thị / tháng',
                'Link trực tiếp đến landing page của bạn',
                'Báo cáo hiệu suất hàng tháng',
              ]
            : [
                'Ad banner on Find Mentors page',
                'Up to 10,000 impressions / month',
                'Direct link to your landing page',
                'Monthly performance report',
              ],
          cta: vi ? 'Bắt đầu ngay' : 'Get started',
          highlight: false,
        },
        {
          name: 'Growth',
          monthlyPrice: 6000000,
          color: 'border-cyan-500',
          badge: vi ? 'Phổ biến nhất' : 'Most Popular',
          badgeColor: 'bg-cyan-600',
          description: vi
            ? 'Lý tưởng cho thương hiệu muốn tiếp cận sinh viên đại học theo quy mô lớn.'
            : 'Ideal for brands wanting to reach university students at scale.',
          features: vi
            ? [
                'Banner + thẻ tài trợ in-feed nổi bật',
                'Tối đa 50.000 lượt hiển thị / tháng',
                'Vị trí nổi bật trên trang chủ',
                'Huy hiệu tài trợ trên hồ sơ Mentor',
                'Dashboard phân tích 2 tuần / lần',
                'Account manager riêng',
              ]
            : [
                'Prominent banner + in-feed sponsored card',
                'Up to 50,000 impressions / month',
                'Featured placement on homepage',
                'Sponsor badge on Mentor profiles',
                'Analytics dashboard bi-weekly',
                'Dedicated account manager',
              ],
          cta: vi ? 'Bắt đầu ngay' : 'Get started',
          highlight: true,
        },
        {
          name: 'Enterprise',
          monthlyPrice: null,
          color: 'border-slate-700',
          badge: vi ? 'Doanh nghiệp lớn' : 'Enterprise',
          badgeColor: 'bg-slate-800',
          description: vi
            ? 'Tích hợp toàn nền tảng dành cho đối tác doanh nghiệp và trường đại học.'
            : 'Full-platform integration for enterprise partners and universities.',
          features: vi
            ? [
                'Tất cả tính năng của gói Growth',
                'Tài nguyên & nội dung bài viết tài trợ',
                'Sự kiện mentor đồng thương hiệu',
                'Đặt quảng cáo trong email newsletter',
                'Chiến lược chiến dịch tùy chỉnh',
                'Hỗ trợ ưu tiên 24/7 & cam kết SLA',
              ]
            : [
                'All features of Growth plan',
                'Sponsored resources & content',
                'Co-branded mentor workshops',
                'Student newsletter placement',
                'Custom marketing strategy',
                'Priority 24/7 support & SLA',
              ],
          cta: vi ? 'Liên hệ tư vấn' : 'Contact us',
          highlight: false,
        },
      ];

  const getPrice = (plan: AdPlan) => {
    if (!plan.monthlyPrice) return null;
    return billing === 'yearly'
      ? Math.round(plan.monthlyPrice * 10)
      : plan.monthlyPrice;
  };

  const getPerMonth = (plan: AdPlan) => {
    if (!plan.monthlyPrice) return null;
    return billing === 'yearly'
      ? Math.round((plan.monthlyPrice * 10) / 12)
      : plan.monthlyPrice;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitPartnershipLead({
        companyName,
        contactName,
        email,
        phone,
        goals,
        planName: selectedPlan,
        billingCycle: billing,
      });

      toast.success(
        vi
          ? 'Yêu cầu hợp tác đã được gửi thành công! Chúng tôi sẽ liên hệ trong vòng 1–2 ngày làm việc.'
          : 'Partnership inquiry submitted successfully! We will get in touch within 1–2 business days.'
      );
      onClose();
      setTimeout(() => {
        setStep('plans');
        setCompanyName('');
        setContactName('');
        setEmail('');
        setPhone('');
        setGoals('');
      }, 300);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (vi ? 'Không thể gửi yêu cầu lúc này. Vui lòng thử lại.' : 'Failed to submit request.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-[96vw] sm:max-w-4xl md:max-w-5xl lg:max-w-5xl max-h-[92vh] overflow-y-auto p-0 bg-slate-900 border-slate-800 text-slate-100 shadow-2xl [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-cyan-500"
        aria-describedby={undefined}
      >
        <div className="sticky top-0 z-20 rounded-t-lg border-b border-slate-800 bg-slate-900/95 px-6 py-3 sm:py-3.5 backdrop-blur-md">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-white">
            <span className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm shadow-cyan-500/20">
              <Megaphone className="size-4" />
            </span>
            {step === 'plans'
              ? (vi ? 'Quảng cáo & Hợp tác với DynForge' : 'Advertise & Partner with DynForge')
              : (vi ? `Đăng ký gói ${selectedPlan}` : `Register for ${selectedPlan} Plan`)}
          </DialogTitle>
        </div>

        <div className="px-5 sm:px-6 pb-4 pt-3.5">
          {step === 'plans' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 sm:p-4 backdrop-blur-sm">
                <p className="mb-2.5 text-xs sm:text-sm text-slate-300 text-center sm:text-left leading-relaxed">
                  {vi ? (
                    <>
                      Tiếp cận <strong className="text-white font-semibold">12.000+ sinh viên đại học</strong> đang chủ động tìm kiếm tài nguyên học thuật và cố vấn chuyên sâu.
                    </>
                  ) : (
                    <>
                      Reach <strong className="text-white font-semibold">12,000+ university students</strong> actively seeking academic resources and mentorship.
                    </>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {stats.map(({ icon: Icon, value, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/70 p-2 sm:p-2.5 text-center transition-all hover:border-cyan-500/30 hover:bg-slate-900"
                    >
                      <Icon className="mb-1 size-4 text-cyan-400" />
                      <p className="font-extrabold text-white text-base sm:text-lg leading-tight tracking-tight">{value}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400 leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="inline-flex items-center p-1 rounded-full bg-slate-950 border border-slate-800 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setBilling('monthly')}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      billing === 'monthly'
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-500/25'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {vi ? 'Theo tháng' : 'Monthly'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBilling('yearly')}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      billing === 'yearly'
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-500/25'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{vi ? 'Theo năm' : 'Yearly'}</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold">
                      -17%
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid gap-3.5 md:grid-cols-3 items-stretch">
                {adPlans.map((plan) => {
                  const price = getPrice(plan);
                  const perMonth = getPerMonth(plan);
                  const selected = selectedPlan === plan.name;
                  return (
                    <div
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan.name)}
                      className={`relative flex cursor-pointer flex-col rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-5 transition-all duration-300 ${
                        selected
                          ? 'border-cyan-500 bg-gradient-to-b from-cyan-950/30 via-slate-900 to-slate-950 shadow-2xl shadow-cyan-500/20 ring-1 ring-cyan-500/40 scale-[1.01]'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      {plan.badge && (
                        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg ${plan.badgeColor}`}>
                          {plan.badge}
                        </span>
                      )}
                      {selected && (
                        <span className="absolute right-3.5 top-3.5 flex size-5 sm:size-6 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold">
                          <Check className="size-3 stroke-[3]" />
                        </span>
                      )}

                      <p className="font-bold text-white text-lg tracking-tight">{plan.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400 leading-snug min-h-[28px]">{plan.description}</p>

                      {/* Pricing block */}
                      <div className="mt-3 mb-1.5 pb-2.5 border-b border-slate-800/80">
                        {price !== null ? (
                          <div>
                            <div className="flex items-baseline gap-1 flex-wrap">
                              <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none">
                                {formatCurrency(price, lang)}
                              </span>
                              <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">
                                /&nbsp;{billing === 'yearly' ? (vi ? 'năm' : 'yr') : (vi ? 'tháng' : 'mo')}
                              </span>
                            </div>
                            {billing === 'yearly' && perMonth !== null ? (
                              <div className="mt-1.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  ~ {formatCurrency(perMonth, lang)}/{vi ? 'tháng' : 'mo'} · {vi ? 'Tiết kiệm 2 tháng' : 'Save 2 mos'}
                                </span>
                              </div>
                            ) : (
                              <div className="h-5 mt-1" />
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline">
                              <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none">
                                {vi ? 'Liên hệ' : 'Contact Us'}
                              </span>
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-400 font-medium">
                              {vi ? 'Báo giá giải pháp theo nhu cầu riêng' : 'Custom solution pricing on request'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Feature list */}
                      <ul className="mt-2.5 flex-1 space-y-2">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-slate-300 leading-snug">
                            <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
                              <Check className="size-2 stroke-[3]" />
                            </span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Direct select button inside card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(plan.name);
                        }}
                        className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          selected
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {selected ? (
                          <>
                            <Check className="size-3.5 stroke-[3]" />
                            {vi ? 'Đã chọn gói này' : 'Selected Plan'}
                          </>
                        ) : (
                          vi ? 'Chọn gói này' : 'Select Plan'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action Bar */}
              <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-6 -mb-4 mt-4 flex flex-col gap-2.5 border-t border-slate-800 bg-slate-900/95 px-5 sm:px-6 py-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between rounded-b-lg">
                <div>
                  <p className="text-xs text-slate-400">
                    {vi ? 'Gói đang chọn:' : 'Selected plan:'}{' '}
                    <strong className="text-white text-sm font-bold">{selectedPlan}</strong>
                    {billing === 'yearly' && (
                      <span className="ml-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-emerald-300 text-[11px] font-semibold">
                        {vi ? 'Thanh toán năm (-17%)' : 'Yearly plan (-17%)'}
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => setStep('contact')}
                  className="shrink-0 gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-5 py-2 text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02]"
                >
                  {vi ? 'Tiếp tục đăng ký' : 'Continue to Register'} <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {/* Selected plan summary badge */}
              <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm">
                <div>
                  <span className="text-slate-300">{vi ? 'Gói đã chọn:' : 'Selected plan:'}</span>{' '}
                  <strong className="text-white">{selectedPlan}</strong>
                  <span className="ml-2 text-slate-400 text-xs">
                    ({billing === 'yearly' ? (vi ? 'Thanh toán năm' : 'Yearly billing') : (vi ? 'Thanh toán tháng' : 'Monthly billing')})
                  </span>
                  {(() => {
                    const plan = adPlans.find((p) => p.name === selectedPlan);
                    const p = plan ? getPrice(plan) : null;
                    return p ? (
                      <span className="ml-2 font-semibold text-cyan-300">
                        {formatCurrency(p, lang)}/{billing === 'yearly' ? (vi ? 'năm' : 'yr') : (vi ? 'tháng' : 'mo')}
                      </span>
                    ) : null;
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => setStep('plans')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
                >
                  {vi ? 'Đổi gói' : 'Change plan'}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-slate-300 text-xs font-medium">
                    {vi ? 'Tên công ty / thương hiệu *' : 'Company / Brand name *'}
                  </Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={vi ? 'vd: FPT Software' : 'e.g. FPT Software'}
                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-slate-300 text-xs font-medium">
                    {vi ? 'Người liên hệ *' : 'Contact person *'}
                  </Label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={vi ? 'Họ và tên' : 'Full name'}
                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-slate-300 text-xs font-medium">
                    {vi ? 'Email doanh nghiệp *' : 'Work email *'}
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@company.com"
                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-slate-300 text-xs font-medium">
                    {vi ? 'Số điện thoại / Zalo' : 'Phone / WhatsApp'}
                  </Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+84 ..."
                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block text-slate-300 text-xs font-medium">
                  {vi ? 'Mục tiêu chiến dịch & Ghi chú' : 'Campaign goals & Notes'}
                </Label>
                <Textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder={vi ? 'Mô tả ngắn về thương hiệu, đối tượng sinh viên bạn muốn tiếp cận...' : 'Describe your brand, target audience, or campaign goals...'}
                  rows={3}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-slate-400">
                <Mail className="size-4 shrink-0 text-cyan-400" />
                <span>
                  {vi
                    ? 'Đội ngũ phụ trách hợp tác DynForge sẽ liên hệ lại trong vòng 1–2 ngày làm việc.'
                    : 'DynForge partnership team will reach out within 1–2 business days.'}
                </span>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('plans')}
                  className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  {vi ? 'Quay lại' : 'Back'}
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium">
                  {vi ? 'Gửi yêu cầu hợp tác' : 'Submit Partnership Request'}
                </Button>
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
  const { T, lang } = useLanguage();

  const trustBadges = [
    {
      icon: ShieldCheck,
      title: lang === 'vi' ? 'Mentor đã xác minh' : 'Verified Mentors',
      desc: lang === 'vi' ? '100% mentor được kiểm định hồ sơ & học vấn' : 'Identity & credentials verified',
    },
    {
      icon: Star,
      title: lang === 'vi' ? 'Đánh giá thật từ sinh viên' : 'Real Student Reviews',
      desc: lang === 'vi' ? 'Đánh giá thực tế từ sinh viên sau buổi học' : 'Authentic feedback from real sessions',
    },
    {
      icon: CreditCard,
      title: lang === 'vi' ? 'Thanh toán ký quỹ an toàn' : 'Secure Escrow Payment',
      desc: lang === 'vi' ? 'Học phí ký quỹ an toàn đến khi hoàn tất' : 'Funds held safely in escrow until done',
    },
    {
      icon: Target,
      title: lang === 'vi' ? 'Ghép nối theo mã môn học' : 'Course-Based Matching',
      desc: lang === 'vi' ? 'Ghép nối chính xác theo mã môn & giáo trình' : 'Matched by university course code',
    },
  ];

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
        { label: T.aboutDynForge, to: '/about' },
        { label: T.careers, to: '/about' },
        { label: T.contact, to: '/support/contact' },
        { label: T.admin, to: '/admin' },
      ],
    },
  ];

  return (
    <>
      {/* ── TRUST BADGES BAND (Moved to Footer) ───────────────────────── */}
      <section className="relative z-10 border-t border-white/10 bg-slate-950/60 backdrop-blur-md py-8">
        <div className="mx-auto max-w-[1240px] px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trustBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/40 hover:bg-white/10"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm tracking-wide">
                      {badge.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Partnership banner */}
      <div className="border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto max-w-[1240px] px-5 py-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Megaphone className="size-5 text-cyan-400" />
                <span className="text-xs text-cyan-400 uppercase tracking-widest font-semibold">
                  {T.footerForBusinesses}
                </span>
              </div>
              <h3 className="text-white text-xl font-semibold">
                {T.footerPartnerTitle}
              </h3>
              <p className="mt-1 text-sm text-slate-400 max-w-lg">
                {T.footerPartnerDesc}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:shrink-0">
              <Button
                onClick={() => setShowPartner(true)}
                className="liquid-glass border border-cyan-400/30 bg-cyan-600/30 text-white hover:bg-cyan-600/40 gap-2 font-medium"
              >
                <Megaphone className="size-4" /> {T.viewAdvertisingPlans}
              </Button>
              <p className="text-center text-xs text-slate-500">{T.noCommitment}</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md text-slate-300">
        <div className="mx-auto max-w-[1240px] px-5 py-14">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <Logo light showTagline size="md" />
              <p className="mt-4 max-w-xs text-sm text-slate-400 leading-relaxed">
                {T.footerTagline}
              </p>
              <button
                onClick={() => setShowPartner(true)}
                className="mt-4 flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 font-medium"
              >
                <Megaphone className="size-3.5" /> {T.partnerWithUs}
              </button>
            </div>
            {dynamicColumns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-3 font-semibold text-white">
                  {col.title}
                </h4>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-slate-400 transition-colors hover:text-cyan-300"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800/80 pt-6 text-sm text-slate-400 sm:flex-row">
            <span>{T.copyright}</span>
            <span>{T.paymentsSecured}</span>
          </div>
        </div>
      </footer>

      <PartnershipModal open={showPartner} onClose={() => setShowPartner(false)} />
    </>
  );
}
