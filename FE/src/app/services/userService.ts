import api from './api';
import { resizeImage } from '../lib/image';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  roles: string[];
  studentId?: string;
  major?: string;
  year?: string;
  avatarUrl?: string;
  universityId?: string;
  universityName?: string;
  universityCode?: string;
  schoolVerified?: boolean;
  walletBalance: number;
  status: string;
  createdAt: string;
  mentorVerified?: boolean;
  birthYear?: number;
  province?: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone?: string;
  studentId?: string;
  major?: string;
  year?: string;
  avatarUrl?: string;
  birthYear?: number;
  province?: string;
  universityCode?: string;
}

/** Shrinks the photo in the browser, uploads it and returns the updated profile (with the new avatarUrl). */
export async function uploadAvatar(file: File): Promise<UserProfile> {
  const blob = await resizeImage(file);
  const form = new FormData();
  form.append('file', blob, 'avatar.jpg');
  const { data } = await api.post('/api/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data as UserProfile;
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get('/api/users/me');
  return data.data as UserProfile;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const { data } = await api.put('/api/users/me', payload);
  return data.data as UserProfile;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/api/users/me/password', { currentPassword, newPassword });
}
