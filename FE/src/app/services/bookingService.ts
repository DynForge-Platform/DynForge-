import api from './api';

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'ESCROW_HELD'
  | 'TAUGHT'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'REFUNDED'
  | 'CANCELLED';

export type BookingFormat = 'ONE_ON_ONE' | 'GROUP';

export interface BookingResponse {
  id: string;
  menteeId: string;
  mentorId: string;
  courseCode: string;
  format: BookingFormat;
  startAt: string;
  durationMin: number;
  price: number;
  commissionRate: number;
  status: BookingStatus;
  escrowTxnId?: string;
  createdAt: string;
  taughtAt?: string;
}

export interface CreateBookingPayload {
  mentorId: string;
  courseCode: string;
  format: BookingFormat;
  startAt: string;
  durationMin: number;
}

export async function createBooking(payload: CreateBookingPayload): Promise<BookingResponse> {
  const { data } = await api.post('/api/bookings', payload);
  return data.data as BookingResponse;
}

export async function getMyBookings(): Promise<BookingResponse[]> {
  const { data } = await api.get('/api/bookings/mine');
  return data.data as BookingResponse[];
}

export async function getBookingById(id: string): Promise<BookingResponse> {
  const { data } = await api.get(`/api/bookings/${id}`);
  return data.data as BookingResponse;
}

export async function payBooking(id: string): Promise<BookingResponse> {
  const { data } = await api.post(`/api/bookings/${id}/pay`);
  return data.data as BookingResponse;
}

export async function markTaught(id: string): Promise<BookingResponse> {
  const { data } = await api.patch(`/api/bookings/${id}/mark-taught`);
  return data.data as BookingResponse;
}

export async function confirmBooking(id: string): Promise<BookingResponse> {
  const { data } = await api.patch(`/api/bookings/${id}/confirm`);
  return data.data as BookingResponse;
}

export async function disputeBooking(id: string): Promise<BookingResponse> {
  const { data } = await api.patch(`/api/bookings/${id}/dispute`);
  return data.data as BookingResponse;
}

export async function cancelBooking(id: string): Promise<BookingResponse> {
  const { data } = await api.patch(`/api/bookings/${id}/cancel`);
  return data.data as BookingResponse;
}

export function mapStatusToDisplay(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    PENDING_PAYMENT: 'Pending Payment',
    ESCROW_HELD: 'In Escrow',
    TAUGHT: 'Taught',
    COMPLETED: 'Completed',
    DISPUTED: 'Disputed',
    REFUNDED: 'Refunded',
    CANCELLED: 'Cancelled',
  };
  return map[status] ?? status;
}
