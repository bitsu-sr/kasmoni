// Member interface
export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthplace: string;
  address: string;
  city: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  nationality: string;
  occupation: string;
  bankName: string;
  accountNumber: string;
  registrationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'administrator' | 'super_user' | 'normal_user';
  createdBy?: number;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  userType?: 'system' | 'member';
  memberId?: number; // For member users
  firstName?: string; // For member users
  lastName?: string; // For member users
}

export interface UserLog {
  id: number;
  userId: number;
  action: 'login' | 'logout' | 'failed_login';
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'administrator' | 'super_user' | 'normal_user';
}

// Group interface
export interface Group {
  id?: number;
  name: string;
  monthlyAmount: number;
  maxMembers: number;
  duration: number;
  startMonth: string;
  endMonth: string;
  createdAt?: string;
  updatedAt?: string;
  status?: GroupStatus;
}

export type GroupStatus = 'not_paid' | 'pending' | 'fully_paid';

// Group Member interface (junction table)
export interface GroupMember {
  id?: number;
  groupId: number;
  memberId: number;
  receiveMonth: string;
  joinedAt?: string;
  member?: Member; // Joined member data
}

// Payment interface
export interface Payment {
  id?: number;
  groupId: number;
  memberId: number;
  amount: number;
  paymentDate: string;
  paymentMonth: string;
  slot: string; // The specific month/slot this payment is for (YYYY-MM format)
  paymentType: 'cash' | 'bank_transfer';
  senderBank?: string;
  receiverBank?: string;
  status: 'not_paid' | 'pending' | 'received' | 'settled';
  proofOfPayment?: string;
  createdAt?: string;
  updatedAt?: string;
  member?: Member; // Joined member data
  group?: Group; // Joined group data
}

// Payment Request interface
export interface PaymentRequest {
  id?: number;
  memberId: number;
  groupId: number;
  amount: number;
  paymentDate: string;
  paymentMonth: string;
  slot: string; // The specific month/slot this payment is for (YYYY-MM format)
  paymentType: 'cash' | 'bank_transfer';
  senderBank?: string;
  receiverBank?: string;
  proofOfPayment?: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  requestNotes?: string;
  adminNotes?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  member?: Member; // Joined member data
  group?: Group; // Joined group data
  reviewer?: User; // Admin who reviewed
}

// Trashbox Payment interface
export interface TrashboxPayment {
  id: number;
  original_id: number;
  groupId: number;
  memberId: number;
  amount: number;
  paymentDate: string;
  paymentMonth: string;
  slot: string;
  paymentType: 'cash' | 'bank_transfer';
  senderBank?: string;
  receiverBank?: string;
  status: 'not_paid' | 'pending' | 'received' | 'settled';
  proofOfPayment?: string;
  deleted_at: string;
  deleted_by_user_id?: number;
  deleted_by_username?: string;
  restore_reason?: string;
  member?: Member; // Joined member data
  group?: Group; // Joined group data
}

// Payment Log interface
export interface PaymentLog {
  id: number;
  payment_id?: number;
  action: 'created' | 'status_changed' | 'updated' | 'deleted' | 'bulk_created' | 'restored' | 'permanently_deleted' | 'archived';
  old_status?: 'not_paid' | 'pending' | 'received' | 'settled';
  new_status?: 'not_paid' | 'pending' | 'received' | 'settled';
  old_amount?: number;
  new_amount?: number;
  old_payment_date?: string;
  new_payment_date?: string;
  old_payment_month?: string;
  new_payment_month?: string;
  old_payment_type?: 'cash' | 'bank_transfer';
  new_payment_type?: 'cash' | 'bank_transfer';
  old_sender_bank?: string;
  new_sender_bank?: string;
  old_receiver_bank?: string;
  new_receiver_bank?: string;
  old_proof_of_payment?: string;
  new_proof_of_payment?: string;
  member_id?: number;
  group_id?: number;
  bulk_payment_count?: number;
  details?: string;
  performed_by_user_id?: number;
  performed_by_username?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  member?: Member; // Joined member data
  group?: Group; // Joined group data
  payment?: Payment; // Joined payment data
}

// Dashboard statistics interface
export interface DashboardStats {
  totalMembers: number;
  totalGroups: number;
  totalPayments: number;
  totalAmountPaid: number;
  totalAmountReceived: number;
  totalAmountExpected: number;
  overduePayments: number;
  pendingPayments: number;
  pendingAmount: number;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Bank interface
export interface Bank {
  id?: number;
  bankName: string;
  shortName: string;
  bankAddress: string;
  createdAt?: string;
  updatedAt?: string;
} 