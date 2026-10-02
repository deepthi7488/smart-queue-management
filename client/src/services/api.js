import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors uniformly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, token might be expired
      // Do not redirect if already on login/register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Doctor Services
export const doctorService = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  updateStatus: (id, data) => api.put(`/doctors/${id}/status`, data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
};

// Token Services
export const tokenService = {
  bookOnline: (data) => api.post('/tokens/book-online', data),
  bookOffline: (data) => api.post('/tokens/book-offline', data),
  getMyTokens: () => api.get('/tokens/my-tokens'),
  getStatus: (id) => api.get(`/tokens/${id}/status`),
  cancel: (id, reason) => api.put(`/tokens/${id}/cancel`, { reason }),
};

// Queue Services
export const queueService = {
  getAdminStats: () => api.get('/queue/admin/stats'),
  getDoctorQueue: (doctorId) => api.get(`/queue/doctor/${doctorId}`),
  callNext: (doctorId) => api.post('/queue/call-next', { doctorId }),
  completeConsultation: (doctorId, notes) => api.post('/queue/complete-consultation', { doctorId, notes }),
  markMissed: (tokenId, reason) => api.post('/queue/mark-missed', { tokenId, reason }),
  updateDuration: (doctorId, additionalMinutes, reason) =>
    api.put('/queue/update-duration', { doctorId, additionalMinutes, reason }),
};

// Patient Services
export const patientService = {
  getAll: (params) => api.get('/patients', { params }),
};

export default api;
