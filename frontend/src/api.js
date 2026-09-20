import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Admin endpoints need the bearer token issued at login. Attaching it to every
// request is harmless for public endpoints, which simply ignore it.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 on an admin call means the token expired or was revoked: drop the
// stale session so AdminRoute sends the user back to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401 && localStorage.getItem('adminToken') && !url.includes('/admin/login')) {
      localStorage.removeItem('adminToken');
      window.dispatchEvent(new Event('admin-session-expired'));
    }
    return Promise.reject(error);
  },
);

export default api;
