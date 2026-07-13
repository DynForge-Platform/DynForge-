import api from './api';
import type { Review } from '../data/mockData';

export interface ReviewResponse {
  id: string;
  bookingId: string;
  menteeId: string;
  menteeName?: string;
  menteeAvatar?: string;
  mentorId: string;
  courseCode: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export async function listMentorReviews(mentorUserId: string): Promise<ReviewResponse[]> {
  const { data } = await api.get('/api/reviews', { params: { mentorId: mentorUserId } });
  return data.data as ReviewResponse[];
}

export async function createReview(bookingId: string, rating: number, comment?: string): Promise<ReviewResponse> {
  const { data } = await api.post('/api/reviews', { bookingId, rating, comment });
  return data.data as ReviewResponse;
}

/** Maps a backend ReviewResponse to the Review shape used by ReviewCard. */
export function backendToReview(r: ReviewResponse): Review {
  return {
    id: r.id,
    author: r.menteeName ?? 'Student',
    avatar: r.menteeAvatar ?? '',
    rating: r.rating,
    date: r.createdAt,
    course: r.courseCode,
    text: r.comment ?? '',
  };
}
