import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { listUniversities, type UniversityResponse } from '../services/universityService';
import { getMe } from '../services/userService';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'dynforge_university';

interface UniversityCtx {
  /** Public universities (ACTIVE / LAUNCHING). */
  universities: UniversityResponse[];
  /** Currently selected university code slug, or null = all universities. */
  selectedCode: string | null;
  /** The resolved university object for {@link selectedCode}, if loaded. */
  selectedUniversity: UniversityResponse | null;
  setSelectedCode: (code: string | null) => void;
  loading: boolean;
}

const UniversityContext = createContext<UniversityCtx>({
  universities: [],
  selectedCode: null,
  selectedUniversity: null,
  setSelectedCode: () => {},
  loading: true,
});

export function UniversityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [universities, setUniversities] = useState<UniversityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCodeState] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored || stored === 'ALL' || stored === 'all') return null;
    return stored;
  });

  const setSelectedCode = (code: string | null) => {
    const normalized = (!code || code === 'all' || code === 'ALL') ? null : code;
    setSelectedCodeState(normalized);
    if (normalized) {
      localStorage.setItem(STORAGE_KEY, normalized);
    } else {
      // Persist explicit 'ALL' so page reload remembers the user chose all universities
      localStorage.setItem(STORAGE_KEY, 'ALL');
    }
  };

  // Load the public university list once.
  useEffect(() => {
    listUniversities()
      .then(setUniversities)
      .catch(() => setUniversities([]))
      .finally(() => setLoading(false));
  }, []);

  // Default to the logged-in user's university ONLY when no explicit choice has been stored yet.
  useEffect(() => {
    // If user already chose a specific school or explicitly chose "All" ('ALL'), do not override.
    if (localStorage.getItem(STORAGE_KEY) !== null) return;
    if (!user) return;
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled && me.universityCode) {
          setSelectedCodeState(me.universityCode);
          localStorage.setItem(STORAGE_KEY, me.universityCode);
        }
      })
      .catch(() => { /* stay on "all universities" */ });
    return () => { cancelled = true; };
  }, [user]);

  const selectedUniversity =
    universities.find((u) => u.code === selectedCode) ?? null;

  return (
    <UniversityContext.Provider
      value={{ universities, selectedCode, selectedUniversity, setSelectedCode, loading }}
    >
      {children}
    </UniversityContext.Provider>
  );
}

export function useUniversity() {
  return useContext(UniversityContext);
}
