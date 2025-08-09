import axios from 'axios';

// Use environment variable for API URL in production, fallback to same domain for Vercel
const API_BASE_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}/api`;

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
  getAll: (params) => api.get('/members', { params }),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
  getGroups: (id) => api.get(`/members/${id}/groups`),
  getSlots: (id) => api.get(`/members/${id}/slots`),
  search: (query) => api.get('/members/search', { params: { q: query } }),
  bulkCreate: (data) => api.post('/members/bulk', data),
  export: (format = 'csv') => api.get(`/members/export?format=${format}`, { responseType: 'blob' }),
};

// Groups API
export const groupsApi = {
  getAll: (params) => api.get('/groups', { params }),
  getById: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  addMember: (groupId, data) => api.post(`/groups/${groupId}/members`, data),
  removeMember: (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`),
  getMembers: (groupId) => api.get(`/groups/${groupId}/members`),
  getCurrentRecipient: (groupId) => api.get(`/groups/${groupId}/current-recipient`),
  getWithCurrentRecipients: () => api.get('/groups/with-current-recipients'),
};

// Payments API
export const paymentsApi = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  getByMemberId: (memberId) => api.get(`/payments/member/${memberId}`),
  getByGroup: (groupId) => api.get(`/payments/group/${groupId}`),
  getSlots: (groupId, memberId) => api.get(`/payments/slots/${groupId}/${memberId}`),
  getGroupMembers: (groupId) => api.get(`/payments/group-members/${groupId}`),
  getGroupMembersSlots: (groupId) => api.get(`/payments/group-members-slots/${groupId}`),
  bulkCreate: (data) => api.post('/payments/bulk', data),
  bulkUpdate: (data) => api.put('/payments/bulk', data),
  bulkDelete: (ids) => api.delete('/payments/bulk', { data: { ids } }),
  export: (format = 'csv') => api.get(`/payments/export?format=${format}`, { responseType: 'blob' }),
  restore: (id) => api.post(`/payments/${id}/restore`),
  permanentlyDelete: (id) => api.delete(`/payments/${id}/permanent`),
};

// Payment Requests API
export const paymentRequestsApi = {
  getAll: (params) => api.get('/payment-requests', { params }),
  getById: (id) => api.get(`/payment-requests/${id}`),
  create: (data) => api.post('/payment-requests', data),
  update: (id, data) => api.put(`/payment-requests/${id}`, data),
  delete: (id) => api.delete(`/payment-requests/${id}`),
  approve: (id, data) => api.post(`/payment-requests/${id}/approve`, data),
  reject: (id, data) => api.post(`/payment-requests/${id}/reject`, data),
  getPending: () => api.get('/payment-requests/pending'),
  getByMemberId: (memberId) => api.get(`/payment-requests/member/${memberId}`),
};

// Messages API
export const messagesApi = {
  getAll: (params) => api.get('/messages', { params }),
  getById: (id) => api.get(`/messages/${id}`),
  create: (data) => api.post('/messages', data),
  update: (id, data) => api.put(`/messages/${id}`, data),
  delete: (id) => api.delete(`/messages/${id}`),
  getByMemberId: (memberId) => api.get(`/messages/member/${memberId}`),
  markAsRead: (id) => api.post(`/messages/${id}/read`),
  getUnread: () => api.get('/messages/unread'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getGroupsWithCurrentRecipients: () => api.get('/dashboard/groups-with-current-recipients'),
  getMonthlyTrends: () => api.get('/dashboard/monthly-trends'),
  getGroupPerformance: () => api.get('/dashboard/group-performance'),
};

// Analytics API
export const analyticsApi = {
  getStats: () => api.get('/analytics/stats'),
  getTrends: () => api.get('/analytics/trends'),
  getMonthlyTrends: () => api.get('/analytics/monthly-trends'),
  getGroupPerformance: () => api.get('/analytics/group-performance'),
  getPaymentDistribution: () => api.get('/analytics/payment-distribution'),
  getMemberStats: () => api.get('/analytics/member-stats'),
};

// Users API
export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  changePassword: (id, data) => api.post(`/users/${id}/change-password`, data),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),
  getLogs: (id) => api.get(`/users/${id}/logs`),
};

// Banks API
export const banksApi = {
  getAll: (params) => api.get('/banks', { params }),
  getById: (id) => api.get(`/banks/${id}`),
  create: (data) => api.post('/banks', data),
  update: (id, data) => api.put(`/banks/${id}`, data),
  delete: (id) => api.delete(`/banks/${id}`),
};

// User Logs API
export const userLogsApi = {
  getAll: (params) => api.get('/user-logs', { params }),
  getById: (id) => api.get(`/user-logs/${id}`),
  getByUserId: (userId) => api.get(`/user-logs/user/${userId}`),
  export: (format = 'csv') => api.get(`/user-logs/export?format=${format}`, { responseType: 'blob' }),
};

// Payment Logs API
export const paymentLogsApi = {
  getAll: (params) => api.get('/payment-logs', { params }),
  getById: (id) => api.get(`/payment-logs/${id}`),
  getByPaymentId: (paymentId) => api.get(`/payment-logs/payment/${paymentId}`),
  export: (format = 'csv') => api.get(`/payment-logs/export?format=${format}`, { responseType: 'blob' }),
};

// Notifications API
export const notificationsApi = {
  getPendingPaymentRequests: () => api.get('/notifications/pending-payment-requests'),
  getUnreadMessages: () => api.get('/notifications/unread-messages'),
  getOverduePayments: () => api.get('/notifications/overdue-payments'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
};

// Payouts API
export const payoutsApi = {
  getAll: (params) => api.get('/payouts', { params }),
  getById: (id) => api.get(`/payouts/${id}`),
  getByGroup: (groupId) => api.get(`/payouts/group/${groupId}`),
  create: (data) => api.post('/payouts', data),
  update: (id, data) => api.put(`/payouts/${id}`, data),
  delete: (id) => api.delete(`/payouts/${id}`),
  process: (id) => api.post(`/payouts/${id}/process`),
  export: (format = 'csv') => api.get(`/payouts/export?format=${format}`, { responseType: 'blob' }),
};

export default api;
