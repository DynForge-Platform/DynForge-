import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router';
import { ShieldCheck, ChevronRight, Tag, CheckCircle2, X, Loader2 } from 'lucide-react';
import { getMentor, formatCurrency, type Mentor } from '../data/mockData';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { createBooking, payBooking } from '../services/bookingService';
import { isObjectId, getMentorById, backendToMentor } from '../services/mentorService';
import { toast } from 'sonner';

interface BookingState {
  duration: number;
  mode: string;
  bookingFormat?: 'ONE_ON_ONE' | 'GROUP';
  displayMode?: string;
  format: string;
  day: number;
  month?: number;   // 0-indexed calendar month from ScheduleConsultation
  year?: number;    // calendar year from ScheduleConsultation
  slot: string;
  price: number;
  courseCode?: string;
  mentorId?: string;
}

// All active vouchers the platform accepts (from both admin + mentor pools)
const VALID_VOUCHERS: Record<string, { type: 'percentage' | 'fixed'; value: number; minOrder: number; label: string }> = {
  'GRADORA20':  { type: 'percentage', value: 20,    minOrder: 100000, label: '20% off' },
  'GROUPDEAL':  { type: 'fixed',      value: 30000,  minOrder: 55000,  label: '30.000₫ off' },
  'LINH15':     { type: 'percentage', value: 15,    minOrder: 90000,  label: "15% off (Linh's voucher)" },
  'TRIAL30K':   { type: 'fixed',      value: 30000,  minOrder: 100000, label: '30.000₫ off (Trial)' },
  'WELCOME50K': { type: 'fixed',      value: 50000,  minOrder: 80000,  label: '50.000₫ off (Welcome)' },
};

function calcDiscount(
  voucher: typeof VALID_VOUCHERS[string] | null,
  sessionFee: number
): number {
  if (!voucher) return 0;
  if (voucher.type === 'percentage') return Math.round(sessionFee * (voucher.value / 100));
  return voucher.value;
}

export function OrderSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { T } = useLanguage();

  // All hooks BEFORE any conditional return
  const [mentor, setMentor] = useState<Mentor | undefined>(() => getMentor(id));
  const [mentorLoading, setMentorLoading] = useState(isObjectId(id ?? ''));
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; data: typeof VALID_VOUCHERS[string] } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [applying, setApplying] = useState(false);
  const [paying, setPaying] = useState(false);

  // Fetch the real mentor from the backend when the id is an ObjectId.
  useEffect(() => {
    if (!id || !isObjectId(id)) return;
    getMentorById(id)
      .then((p) => setMentor(backendToMentor(p)))
      .catch(() => { /* keep whatever is in state */ })
      .finally(() => setMentorLoading(false));
  }, [id]);

  // Guard: must be logged in to pay
  if (!user) {
    navigate(`/login?redirect=/mentors/${id}/order`);
    return null;
  }

  if (mentorLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Loading mentor…
      </div>
    );
  }

  if (!mentor) return <div className="p-20 text-center">Mentor not found.</div>;

  const now = new Date();
  const state = (location.state as BookingState) ?? {
    duration: 60,
    mode: '1-on-1',
    bookingFormat: 'ONE_ON_ONE' as const,
    format: 'Online',
    day: now.getDate() + 1,
    month: now.getMonth(),
    year: now.getFullYear(),
    slot: '09:00',
    price: mentor.hourlyRate,
  };

  const sessionFee = state.price;
  const serviceFee = Math.round(sessionFee * 0.05);
  const discount = calcDiscount(appliedVoucher?.data ?? null, sessionFee);
  const total = Math.max(0, sessionFee + serviceFee - discount);

  const applyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    setVoucherError('');

    // Simulate async lookup
    setTimeout(() => {
      const found = VALID_VOUCHERS[code];
      if (!found) {
        setVoucherError('Invalid voucher code. Please check and try again.');
      } else if (sessionFee < found.minOrder) {
        setVoucherError(
          `Minimum order ${formatCurrency(found.minOrder)} required for this voucher.`
        );
      } else {
        setAppliedVoucher({ code, data: found });
        setVoucherInput('');
        setVoucherError('');
      }
      setApplying(false);
    }, 600);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError('');
  };

  const confirm = async () => {
    // Guard: a real booking needs a real mentor (backend ObjectId). Demo/mock mentors
    // have integer ids and cannot be booked with a real payment.
    if (user?.id && state.mentorId && !isObjectId(state.mentorId)) {
      toast.error('This is a demo mentor profile. Please pick a mentor from the live directory to book a real session.');
      return;
    }

    // If user has a real JWT (id exists) and we have a real mentorId + courseCode, call the API
    if (user?.id && state.mentorId && state.courseCode && isObjectId(state.mentorId)) {
      setPaying(true);
      try {
        // Build ISO datetime from selected day + slot using actual calendar month/year
        const yr = state.year ?? now.getFullYear();
        const mo = state.month ?? now.getMonth();
        const [h, m] = state.slot.split(':').map(Number);
        const startAt = new Date(yr, mo, state.day, h, m).toISOString();

        const format = state.bookingFormat ?? 'ONE_ON_ONE';
        const booking = await createBooking({
          mentorId: state.mentorId,
          courseCode: state.courseCode,
          format,
          startAt,
          durationMin: state.duration,
        });

        const paid = await payBooking(booking.id);

        navigate('/escrow', {
          state: {
            mentor: mentor.name,
            amount: paid.price,
            day: state.day,
            slot: state.slot,
            duration: state.duration,
            bookingId: paid.id,
          },
        });
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Payment failed. Please check your wallet balance.');
      } finally {
        setPaying(false);
      }
    } else {
      // Demo mode: navigate without real API call
      navigate('/escrow', {
        state: { mentor: mentor.name, amount: total, day: state.day, slot: state.slot, duration: state.duration },
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to={`/mentors/${mentor.id}/schedule`} className="hover:text-primary">Calendar</Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground" style={{ fontWeight: 500 }}>Order Summary</span>
      </nav>

      <h1 className="mb-8" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700 }}>
        {T.reviewConfirm}
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Mentor summary */}
          <Card className="flex items-center gap-4 border-border p-6">
            <ImageWithFallback src={mentor.avatar} alt={mentor.name} className="size-16 rounded-2xl object-cover" />
            <div>
              <p style={{ fontWeight: 600 }}>{mentor.name}</p>
              <p className="text-sm text-primary">{mentor.role}</p>
              <p className="text-sm text-muted-foreground">{mentor.university}</p>
            </div>
          </Card>

          {/* Session details */}
          <Card className="border-border p-6">
            <h2 className="mb-4" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{T.sessionDetails}</h2>
            <div className="grid gap-y-3 sm:grid-cols-2">
              <Detail label={T.sessionType} value={state.mode} />
              <Detail label={T.date} value={new Date(state.year ?? now.getFullYear(), state.month ?? now.getMonth(), state.day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
              <Detail label={T.time} value={state.slot} />
              <Detail label={T.duration} value={`${state.duration} min`} />
              <Detail label={T.format} value={state.format} />
              <Detail label={T.learningMode} value={state.mode} />
            </div>
          </Card>

          {/* Escrow note */}
          <Card className="flex items-start gap-3 border-success/20 bg-success/5 p-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p style={{ fontWeight: 600 }}>{T.escrowProtection}</p>
              <p className="text-sm text-muted-foreground">{T.escrowDetail}</p>
            </div>
          </Card>
        </div>

        {/* Price breakdown */}
        <aside className="lg:sticky lg:top-[88px] lg:h-fit">
          <Card className="border-border p-6">
            <h2 className="mb-4" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{T.priceBreakdown}</h2>

            <div className="space-y-3 text-sm">
              <PriceRow label={T.sessionFee} value={formatCurrency(sessionFee)} />
              <PriceRow label={T.platformFee} value={formatCurrency(serviceFee)} />

              {/* Voucher row — only shown when applied */}
              {appliedVoucher && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-success">
                    <Tag className="size-3.5" />
                    <span>{appliedVoucher.code}</span>
                    <span className="text-muted-foreground">({appliedVoucher.data.label})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-success" style={{ fontWeight: 500 }}>
                      - {formatCurrency(discount)}
                    </span>
                    <button onClick={removeVoucher} className="rounded-full p-0.5 hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Voucher input */}
            {!appliedVoucher ? (
              <div className="mt-4">
                <p className="mb-2 text-sm text-muted-foreground">{T.haveVoucher}</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={voucherInput}
                      onChange={(e) => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && applyVoucher()}
                      placeholder={T.enterCode}
                      className="bg-input-background pl-9 font-mono tracking-wider uppercase"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={applyVoucher}
                    disabled={!voucherInput.trim() || applying}
                    className="shrink-0"
                  >
                    {applying ? <Loader2 className="size-4 animate-spin" /> : T.apply}
                  </Button>
                </div>
                {voucherError && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                    <X className="size-3.5" /> {voucherError}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Try: GRADORA20 · GROUPDEAL · LINH15
                </p>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
                <CheckCircle2 className="size-4 shrink-0" />
                Voucher <strong>{appliedVoucher.code}</strong> applied — you save {formatCurrency(discount)}!
              </div>
            )}

            {/* Total */}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span style={{ fontWeight: 600 }}>{T.totalAmount}</span>
              <div className="text-right">
                {discount > 0 && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatCurrency(sessionFee + serviceFee)}
                  </p>
                )}
                <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{formatCurrency(total)}</span>
              </div>
            </div>

            <Button className="mt-6 w-full" size="lg" onClick={confirm} disabled={paying}>
              {paying ? <Loader2 className="size-4 animate-spin" /> : T.confirmPay}
            </Button>
            <Button variant="outline" className="mt-3 w-full" onClick={() => navigate(-1)}>
              {T.back}
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {T.paymentSecured}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p style={{ fontWeight: 500 }}>{value}</p>
    </div>
  );
}

function PriceRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? 'text-success' : 'text-foreground'} style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
