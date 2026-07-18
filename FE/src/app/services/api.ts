import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gradora_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('gradora_refresh_token');
        if (!refreshToken) throw new Error('no refresh token');
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        const tokens = data.data;
        localStorage.setItem('gradora_access_token', tokens.accessToken);
        localStorage.setItem('gradora_refresh_token', tokens.refreshToken);
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('gradora_access_token');
        localStorage.removeItem('gradora_refresh_token');
        localStorage.removeItem('gradora_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
