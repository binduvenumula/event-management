import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({ baseURL: API_URL });

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vfstr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired / invalid token (401) logs the user out - AuthContext listens for this event.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginCall = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginCall && localStorage.getItem('vfstr_token')) {
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: error.response.data?.message }));
    }
    return Promise.reject(error);
  }
);

// Pulls a readable message out of an Axios error.
export const errMsg = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || (err?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the API running?' : fallback);

// Unwraps { success, message, data } -> data
export const unwrap = (res) => res.data.data;

export default api;
