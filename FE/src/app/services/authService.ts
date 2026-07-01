import api from './api';

export interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  roles: string[];
  walletBalance: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
}

export async function loginApi(email: string, password: string): Promise<AuthTokens> {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data.data as AuthTokens;
}

export async function registerApi(
  fullName: string,
  email: string,
  password: string,
  role: 'MENTEE' | 'MENTOR'
): Promise<AuthTokens> {
  const { data } = await api.post('/api/auth/register', { fullName, email, password, role });
  return data.data as AuthTokens;
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await api.post('/api/auth/logout', { refreshToken });
}
