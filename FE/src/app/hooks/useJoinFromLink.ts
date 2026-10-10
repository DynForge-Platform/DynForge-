import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { getBookingById, type BookingResponse } from '../services/bookingService';
import { useLanguage } from '../context/LanguageContext';

const NOT_JOINABLE = ['PENDING_PAYMENT', 'CANCELLED', 'REFUNDED'];

/**
 * Opens the in-app meeting room when a dashboard is opened from an email link
 * (`?join=<bookingId>`). Joining through the web app — not meet.jit.si directly —
 * is what lets the session be recorded and stored for admins.
 */
export function useJoinFromLink(onJoin: (booking: BookingResponse) => void) {
  const [params, setParams] = useSearchParams();
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const joinId = params.get('join');

  useEffect(() => {
    if (!joinId) return;
    let cancelled = false;

    getBookingById(joinId)
      .then((b) => {
        if (cancelled) return;
        if (NOT_JOINABLE.includes(b.status)) {
          toast.error(vi ? 'Buổi học này không còn hiệu lực để vào phòng.' : 'This session can no longer be joined.');
          return;
        }
        onJoin(b);
      })
      .catch(() => {
        if (!cancelled) toast.error(vi ? 'Không mở được phòng học từ liên kết này.' : 'Could not open the meeting room from this link.');
      })
      .finally(() => {
        if (cancelled) return;
        const next = new URLSearchParams(params);
        next.delete('join');
        setParams(next, { replace: true });
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinId]);
}
