import api from './api';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VerificationItem {
  id: string;
  userId: string;
  userName?: string;
  avatarUrl?: string;
  course: string;
  claimedGrade: string;
  transcriptUrl?: string;
  status: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  note?: string;
  createdAt: string;
}

export interface SubmitVerificationPayload {
  course: string;
  claimedGrade: 'A' | 'A+';
  transcriptUrl?: string;
}

export async function submitVerification(payload: SubmitVerificationPayload): Promise<VerificationItem> {
  const { data } = await api.post('/api/verifications', payload);
  return data.data as VerificationItem;
}

export async function listMyVerifications(): Promise<VerificationItem[]> {
  const { data } = await api.get('/api/verifications/mine');
  return data.data as VerificationItem[];
}

export async function listVerifications(status?: VerificationStatus): Promise<VerificationItem[]> {
  const { data } = await api.get('/api/verifications', {
    params: status ? { status } : {},
  });
  return data.data as VerificationItem[];
}

export async function decideVerification(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  note?: string
): Promise<VerificationItem> {
  const { data } = await api.post(`/api/verifications/${id}/decision`, { status, note });
  return data.data as VerificationItem;
}
