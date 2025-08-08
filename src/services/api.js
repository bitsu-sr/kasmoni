import axios from 'axios';

// Use environment variable for API URL in production, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization header to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      console.log('API: 401 Unauthorized, token removed');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Members API
export const membersApi = {
  getAll: () => api.get('/members'),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
};

// Groups API
export const groupsApi = {
  getAll: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
};

// Payments API
export const paymentsApi = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};

// Messages API
export const messagesApi = {
  getByMemberId: (memberId) => api.get(`/messages/member/${memberId}`),
  create: (data) => api.post('/messages', data),
  update: (id, data) => api.put(`/messages/${id}`, data),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

// Analytics API
export const analyticsApi = {
  getStats: () => api.get('/analytics/stats'),
  getTrends: () => api.get('/analytics/trends'),
};

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Banks API
export const banksApi = {
  getAll: () => api.get('/banks'),
  getById: (id) => api.get(`/banks/${id}`),
  create: (data) => api.post('/banks', data),
  update: (id, data) => api.put(`/banks/${id}`, data),
  delete: (id) => api.delete(`/banks/${id}`),
};

export default api;
