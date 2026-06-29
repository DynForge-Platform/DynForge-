import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AuthRole = 'mentee' | 'mentor' | 'admin';

interface AuthUser {
  role: AuthRole;
  name: string;
  avatar: string;
  dashboardPath: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (role: AuthRole) => void;
  logout: () => void;
}

const profiles: Record<AuthRole, AuthUser> = {
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

const AuthContext = createContext<AuthCtx>({
  user: null,
  login: () => {},
  logout: () => {},
});

const STORAGE_KEY = 'gradora_role';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as AuthRole | null;
    return saved && profiles[saved] ? profiles[saved] : null;
  });

  const login = (role: AuthRole) => {
    setUser(profiles[role]);
    localStorage.setItem(STORAGE_KEY, role);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
