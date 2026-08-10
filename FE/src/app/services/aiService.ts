import api from './api';

export interface MentorMatchItem {
  mentorId: string;
  name: string;
  reason: string;
}

export interface MentorMatchResult {
  advice: string;
  matches: MentorMatchItem[];
  suggestedQuestions?: string[];
}

/** AI recommends the best-fit mentors for a mentee's free-text need. */
export async function mentorMatch(query: string): Promise<MentorMatchResult> {
  const { data } = await api.post('/api/ai/mentor-match', { query });
  return data.data as MentorMatchResult;
}

export interface SessionAskResult {
  answer: string;
  suggestedQuestions?: string[];
}

/** AI answers a mentee's follow-up question grounded in a specific session. */
export async function askSession(bookingId: string, question: string): Promise<SessionAskResult> {
  const { data } = await api.post(`/api/ai/sessions/${bookingId}/ask`, { question });
  return data.data as SessionAskResult;
}

/** AI rewrites rough in-meeting notes into clean main points. */
export async function rewriteNote(bookingId: string, notes: string): Promise<string> {
  const { data } = await api.post(`/api/ai/sessions/${bookingId}/rewrite-note`, { notes });
  return (data.data as { note: string }).note;
}

/** General AI chatbot for free-form conversation & platform help. */
export async function generalChat(query: string): Promise<SessionAskResult> {
  const { data } = await api.post('/api/ai/chat', { query });
  return data.data as SessionAskResult;
}

