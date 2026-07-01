import { createContext, useContext, useState, ReactNode } from 'react';
import { loginApi, registerApi, logoutApi, type AuthTokens } from '../services/authService';

export type AuthRole = 'mentee' | 'mentor' | 'admin';

export interface AuthUser {
  id?: string;
  role: AuthRole;
  name: string;
  email?: string;
  avatar: string;
  dashboardPath: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (role: AuthRole) => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  registerWithCredentials: (fullName: string, email: string, password: string, role: 'MENTEE' | 'MENTOR') => Promise<void>;
  logout: () => Promise<void>;
}

// Quick-access demo profiles (no real JWT)
const demoProfiles: Record<AuthRole, AuthUser> = {
  mentee: {
    role: 'mentee',
    name: 'Trang Do',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
    dashboardPath: '/dashboard',
  },
  mentor: {
    role: 'mentor',
    name: 'Nguyễn Thị Linh',
    avatar: 'https://images.unsplash.com/photo-1531427888099-b3ecff6e1a6f?auto=format&fit=crop&w=80&q=80',
    dashboardPath: '/mentor/dashboard',
  },
  admin: {
    role: 'admin',
    name: 'Admin · GRADORA',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
    dashboardPath: '/admin/dashboard',
  },
};

const ROLE_KEY = 'gradora_role';
const USER_KEY = 'gradora_user';

function roleFromBackend(roles: string[]): AuthRole {
  if (roles.includes('ADMIN')) return 'admin';
  if (roles.includes('MENTOR')) return 'mentor';
  return 'mentee';
}

function dashboardPath(role: AuthRole) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'mentor') return '/mentor/dashboard';
  return '/dashboard';
}

function buildUserFromTokens(tokens: AuthTokens): AuthUser {
  const role = roleFromBackend(tokens.user.roles);
  return {
    id: tokens.user.id,
    role,
    name: tokens.user.fullName,
    email: tokens.user.email,
    avatar: tokens.user.avatarUrl ?? demoProfiles[role].avatar,
    dashboardPath: dashboardPath(role),
  };
}

function storeTokens(tokens: AuthTokens) {
  localStorage.setItem('gradora_access_token', tokens.accessToken);
  localStorage.setItem('gradora_refresh_token', tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem('gradora_access_token');
  localStorage.removeItem('gradora_refresh_token');
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
}

function loadSavedUser(): AuthUser | null {
  const saved = localStorage.getItem(USER_KEY);
  if (saved) {
    try { return JSON.parse(saved) as AuthUser; } catch { /* ignore */ }
  }
  const role = localStorage.getItem(ROLE_KEY) as AuthRole | null;
  return role && demoProfiles[role] ? demoProfiles[role] : null;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  login: () => {},
  loginWithCredentials: async () => {},
  registerWithCredentials: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadSavedUser);

  // Demo quick-login (no real API)
  const login = (role: AuthRole) => {
    clearTokens();
    const u = demoProfiles[role];
    setUser(u);
    localStorage.setItem(ROLE_KEY, role);
  };

  const loginWithCredentials = async (email: string, password: string) => {
    const tokens = await loginApi(email, password);
    storeTokens(tokens);
    const u = buildUserFromTokens(tokens);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    localStorage.removeItem(ROLE_KEY);
    setUser(u);
  };

  const registerWithCredentials = async (
    fullName: string,
    email: string,
    password: string,
    role: 'MENTEE' | 'MENTOR'
  ) => {
    const tokens = await registerApi(fullName, email, password, role);
    storeTokens(tokens);
    const u = buildUserFromTokens(tokens);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    localStorage.removeItem(ROLE_KEY);
    setUser(u);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('gradora_refresh_token');
    if (refreshToken) {
      try { await logoutApi(refreshToken); } catch { /* ignore — still clear locally */ }
    }
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithCredentials, registerWithCredentials, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
