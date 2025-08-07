import axios from 'axios';
import { 
  Member, 
  Group, 
  GroupMember, 
  Payment, 
  PaymentRequest,
  PaymentLog,
  DashboardStats, 
  MonthlyTrend,
  GroupPerformance,
  RecentActivity,
  GroupWithCurrentRecipient,
  Bank,
  GroupMemberSlot,
  MemberSlot,
  AnalyticsStats,
  User,
  UserLog,
  LoginRequest,
  CreateUserRequest,
  AuthState,
  ApiResponse
} from '../types';

// Use the same hostname as the current page but different port for API
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

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
      // Don't redirect to analytics, let the auth context handle it
      console.log('API: 401 Unauthorized, token removed');
    }
    return Promise.reject(error);
  }
);

// Members API
export const membersApi = {
  getAll: () => api.get<ApiResponse<Member[]>>('/members'),
  getById: (id: number) => api.get<ApiResponse<Member>>(`/members/${id}`),
  getGroups: (id: number) => api.get<ApiResponse<{ groupName: string; receiveMonth: string; monthlyAmount: number; paymentStatus: string }[]>>(`/members/${id}/groups`),
  getSlots: (id: number) => api.get<ApiResponse<MemberSlot[]>>(`/members/${id}/slots`),
  create: (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Member>>('/members', data),
  update: (id: number, data: Partial<Member>) => {
    console.log('API update call:', { id, data });
    return api.put<ApiResponse<Member>>(`/members/${id}`, data);
  },
  delete: (id: number) => api.delete<ApiResponse<void>>(`/members/${id}`),
};

// Groups API
export const groupsApi = {
  getAll: () => api.get<ApiResponse<Group[]>>('/groups'),
  getById: (id: number) => api.get<ApiResponse<Group & { members: GroupMember[] }>>(`/groups/${id}`),
  create: (data: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'endMonth'>) => 
    api.post<ApiResponse<Group>>('/groups', data),
  update: (id: number, data: Partial<Group>) => 
    api.put<ApiResponse<Group>>(`/groups/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/groups/${id}`),
  addMember: (groupId: number, data: { memberId: number; receiveMonth: string }) => 
    api.post<ApiResponse<GroupMember>>(`/groups/${groupId}/members`, data),
  removeMember: (groupId: number, memberId: number) => 
    api.delete<ApiResponse<void>>(`/groups/${groupId}/members/${memberId}`),
};

// Payments API
export const paymentsApi = {
  getAll: () => api.get<ApiResponse<Payment[]>>('/payments'),
  getById: (id: number) => api.get<ApiResponse<Payment>>(`/payments/${id}`),
  getByMemberId: (memberId: number) => api.get<ApiResponse<Payment[]>>(`/payments/member/${memberId}`),
  getByGroup: (groupId: number) => api.get<ApiResponse<Payment[]>>(`/payments/group/${groupId}`),
  getSlots: (groupId: number, memberId: number) => api.get<ApiResponse<{value: string, label: string}[]>>(`/payments/slots/${groupId}/${memberId}`),
  getGroupMembers: (groupId: number) => api.get<ApiResponse<{memberId: number, firstName: string, lastName: string, totalSlots: number, paidSlots: number, isFullyPaid: boolean}[]>>(`/payments/group-members/${groupId}`),
  getGroupMembersSlots: (groupId: number) => api.get<ApiResponse<GroupMemberSlot[]>>(`/payments/group-members-slots/${groupId}`),
  create: (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Payment>>('/payments', data),
  update: (id: number, data: Partial<Payment>) => 
    api.put<ApiResponse<Payment>>(`/payments/${id}`, data),
  updateStatus: (id: number, status: Payment['status']) => 
    api.patch<ApiResponse<Payment>>(`/payments/${id}/status`, { status }),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/payments/${id}`),
  getOverdue: () => api.get<ApiResponse<Payment[]>>('/payments/overdue/list'),
  // Bulk payment endpoints
  validateBulk: (data: { groupId: number; paymentMonth: string; payments: any[] }) => 
    api.post<ApiResponse<any>>('/payments/bulk/validate', data),
  createBulk: (data: { groupId: number; paymentMonth: string; payments: any[] }) => 
    api.post<ApiResponse<Payment[]>>('/payments/bulk', data),
  // Trashbox endpoints
  getTrashbox: () => api.get<ApiResponse<any[]>>('/payments/trashbox/list'),
  restoreFromTrashbox: (id: number) => api.post<ApiResponse<void>>(`/payments/trashbox/${id}/restore`),
  permanentlyDeleteFromTrashbox: (id: number) => api.delete<ApiResponse<void>>(`/payments/trashbox/${id}/permanent`),
  bulkRestoreFromTrashbox: (paymentIds: number[]) => api.post<ApiResponse<any>>('/payments/trashbox/bulk-restore', { paymentIds }),
  bulkPermanentlyDeleteFromTrashbox: (paymentIds: number[]) => api.delete<ApiResponse<any>>('/payments/trashbox/bulk-permanent', { data: { paymentIds } }),
  // Archive endpoints
  getArchive: () => api.get<ApiResponse<any[]>>('/payments/archive/list'),
  archive: (id: number, archiveReason?: string) => api.post<ApiResponse<void>>(`/payments/${id}/archive`, { archive_reason: archiveReason }),
  bulkArchive: (paymentIds: number[], archiveReason?: string) => api.post<ApiResponse<any>>('/payments/bulk-archive', { paymentIds, archive_reason: archiveReason }),
  // Archive management endpoints
  restoreFromArchive: (id: number) => api.post<ApiResponse<void>>(`/payments/archive/${id}/restore`),
  moveArchiveToTrashbox: (id: number, deletionReason?: string) => api.post<ApiResponse<void>>(`/payments/archive/${id}/move-to-trashbox`, { deletion_reason: deletionReason }),
  bulkRestoreFromArchive: (archiveIds: number[]) => api.post<ApiResponse<any>>('/payments/archive/bulk-restore', { archiveIds }),
  bulkMoveArchiveToTrashbox: (archiveIds: number[], deletionReason?: string) => api.post<ApiResponse<any>>('/payments/archive/bulk-move-to-trashbox', { archiveIds, deletion_reason: deletionReason }),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
  getPaymentsByStatus: () => api.get<ApiResponse<any>>('/dashboard/payments-by-status'),
  getMonthlyTrends: () => api.get<ApiResponse<MonthlyTrend[]>>('/dashboard/monthly-trends'),
  getGroupPerformance: () => api.get<ApiResponse<GroupPerformance[]>>('/dashboard/group-performance'),
  getRecentActivities: () => api.get<ApiResponse<RecentActivity[]>>('/dashboard/recent-activities'),
  getGroupsWithCurrentRecipients: () => api.get<ApiResponse<GroupWithCurrentRecipient[]>>('/dashboard/groups-current-month'),
};

// Analytics API
export const analyticsApi = {
  getStats: () => api.get<ApiResponse<AnalyticsStats>>('/analytics/stats'),
};

// Auth API
export const authApi = {
  login: (data: LoginRequest) => api.post<ApiResponse<{ token: string; user: Partial<User> }>>('/auth/login', data),
  logout: () => api.post<ApiResponse<void>>('/auth/logout'),
  getMe: () => api.get<ApiResponse<Partial<User>>>('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) => 
    api.put<ApiResponse<{ message: string }>>('/auth/change-password', data),
  createUser: (data: CreateUserRequest) => api.post<ApiResponse<{ id: number; initialPassword: string }>>('/auth/users', data),
  getUsers: () => api.get<ApiResponse<any[]>>('/auth/users'),
  getLogs: () => api.get<ApiResponse<any[]>>('/auth/logs'),
  // Member user management
  createMemberUser: (memberId: number) => api.post<ApiResponse<{ memberId: number; username: string; password: string }>>(`/auth/members/${memberId}/create-user`),
  updateMemberUsername: (memberId: number, username: string) => api.put<ApiResponse<void>>(`/auth/members/${memberId}/username`, { username }),
  updateMemberPassword: (memberId: number, password: string) => api.put<ApiResponse<void>>(`/auth/members/${memberId}/password`, { password }),
  updateMemberRole: (memberId: number, role: string) => api.put<ApiResponse<void>>(`/auth/members/${memberId}/role`, { role }),
  toggleMemberUserStatus: (memberId: number) => api.put<ApiResponse<void>>(`/auth/members/${memberId}/toggle-status`),
  generateMemberPassword: (memberId: number) => api.post<ApiResponse<{ memberId: number; newPassword: string }>>(`/auth/members/${memberId}/generate-password`),
};

// Banks API
export const banksApi = {
  getAll: () => api.get<ApiResponse<Bank[]>>('/banks'),
  getById: (id: number) => api.get<ApiResponse<Bank>>(`/banks/${id}`),
  create: (data: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Bank>>('/banks', data),
  update: (id: number, data: Partial<Bank>) => 
    api.put<ApiResponse<Bank>>(`/banks/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/banks/${id}`),
};

// Messages API
export const messagesApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/messages'),
  getByMemberId: (memberId: number) => api.get<ApiResponse<any[]>>(`/messages/member/${memberId}`),
  create: (data: { requestType: string; requestDetails: string }) => 
    api.post<ApiResponse<{ id: number; message: string }>>('/messages', data),
  updateStatus: (id: number, status: string, adminNotes?: string) => 
    api.put<ApiResponse<void>>(`/messages/${id}/status`, { status, adminNotes }),
  markAsRead: (id: number) => api.put<ApiResponse<void>>(`/messages/${id}/read`),
  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/messages/unread-count'),
};

// Payment Logs API
export const paymentLogsApi = {
  getList: (params?: any) => api.get<ApiResponse<PaymentLog[]>>('/payment-logs/list', { params }),
  getStats: () => api.get<ApiResponse<any>>('/payment-logs/stats')
};

// Payment Requests API
export const paymentRequestsApi = {
  // Admin methods
  getAll: (params?: { status?: string; memberId?: number; groupId?: number }) => 
    api.get<ApiResponse<PaymentRequest[]>>('/payment-requests', { params }),
  getById: (id: number) => api.get<ApiResponse<PaymentRequest>>(`/payment-requests/${id}`),
  review: (id: number, data: any) => api.put<ApiResponse<void>>(`/payment-requests/${id}/review`, data),
  
  // Member methods
  getByMember: (memberId: number) => 
    api.get<ApiResponse<PaymentRequest[]>>(`/payment-requests/member/${memberId}`),
  getEligibleSlots: (memberId: number) => 
    api.get<ApiResponse<any[]>>(`/payment-requests/member/${memberId}/eligible`),
  create: (data: Omit<PaymentRequest, 'id' | 'memberId' | 'paymentMonth' | 'status' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<PaymentRequest>>('/payment-requests', data),
  
  // Notification methods
  getPendingCount: () => api.get<ApiResponse<{ count: number }>>('/payment-requests/pending-count')
};

// Notifications API
export const notificationsApi = {
  getPendingPaymentRequests: () => api.get<ApiResponse<{ count: number }>>('/payment-requests/pending-count'),
  getUnreadMessages: () => api.get<ApiResponse<{ count: number }>>('/messages/unread-count')
};

export default api; 