import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('hp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    /* storage unavailable */
  }
  return config;
});

export const errMsg = (e) => e?.response?.data?.message || 'Something went wrong. Please try again.';
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default api;
