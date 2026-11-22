import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dynforge_access_token') || localStorage.getItem('gradora_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Single-flight refresh promise prevents concurrent 401 responses from racing
// against single-use refresh token rotation on the backend.
let refreshPromise: Promise<string> | null = null;

function clearAllAuthStorage() {
  localStorage.removeItem('dynforge_access_token');
  localStorage.removeItem('dynforge_refresh_token');
  localStorage.removeItem('dynforge_user');
  localStorage.removeItem('dynforge_role');
  localStorage.removeItem('gradora_access_token');
  localStorage.removeItem('gradora_refresh_token');
  localStorage.removeItem('gradora_user');
  localStorage.removeItem('gradora_role');
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthEndpoint = original?.url?.includes('/api/auth/');

    if (err.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const refreshToken = localStorage.getItem('dynforge_refresh_token') || localStorage.getItem('gradora_refresh_token');
            if (!refreshToken) throw new Error('no refresh token');
            const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
            const tokens = data.data;
            localStorage.setItem('dynforge_access_token', tokens.accessToken);
            localStorage.setItem('dynforge_refresh_token', tokens.refreshToken);
            return tokens.accessToken as string;
          })().finally(() => {
            refreshPromise = null;
          });
        }
        const newAccessToken = await refreshPromise;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch {
        clearAllAuthStorage();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
