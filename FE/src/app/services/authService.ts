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
  // Backend RegisterRequest expects `asMentor` (boolean), not `role`.
  const { data } = await api.post('/api/auth/register', {
    fullName,
    email,
    password,
    asMentor: role === 'MENTOR',
  });
  return data.data as AuthTokens;
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await api.post('/api/auth/logout', { refreshToken });
}

// ── Google Sign-In ────────────────────────────────────────────────────────────

/** OAuth client id configured on the backend; empty string = Google Sign-In not configured. */
export async function getGoogleClientId(): Promise<string> {
  const { data } = await api.get('/api/auth/google/config');
  return (data.data?.clientId as string) ?? '';
}

/** Exchanges a Google ID token (GIS credential) for our own JWT session. */
export async function googleLoginApi(idToken: string): Promise<AuthTokens> {
  const { data } = await api.post('/api/auth/google', { idToken });
  return data.data as AuthTokens;
}

// ── Password reset (OTP) ──────────────────────────────────────────────────────

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/api/auth/forgot-password', { email });
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  await api.post('/api/auth/verify-otp', { email, otp });
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  await api.post('/api/auth/reset-password', { email, otp, newPassword });
}
