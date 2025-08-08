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

export interface Group {
  id: number;
  name: string;
  monthlyAmount: number;
  maxMembers: number;
  duration: number;
  startMonth: string;
  endMonth: string;
  createdAt: string;
  updatedAt: string;
  status?: GroupStatus;
  pendingCount?: number;
}

export type GroupStatus = 'not_paid' | 'pending' | 'fully_paid';

export interface GroupMember {
  id: number;
  groupId: number;
  memberId: number;
  receiveMonth: string;
  joinedAt: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  nationalId?: string;
  member?: Member;
  group?: Group;
}

export interface Payment {
  id: number;
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
  createdAt: string;
  updatedAt: string;
  member?: Member;
  group?: Group;
}

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
  member?: Member;
  group?: Group;
  reviewer?: User;
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
  member?: Member;
  group?: Group;
}

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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MonthlyTrend {
  month: string;
  amountPaid: number;
  amountReceived: number;
  paymentCount: number;
}

export interface GroupPerformance {
  groupId: number;
  groupName: string;
  totalMembers: number;
  totalAmount: number;
  completionPercentage: number;
}

export interface RecentActivity {
  id: number;
  type: 'payment' | 'member_added' | 'group_created';
  description: string;
  amount?: number;
  date: string;
}

export interface GroupWithCurrentRecipient {
  id: number;
  name: string;
  monthlyAmount: number;
  receiveMonth: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  bankName: string | null;
  accountNumber: string | null;
  status?: GroupStatus;
  pendingCount?: number;
}

export interface Bank {
  id: number;
  bankName: string;
  shortName: string;
  bankAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMemberSlot {
  memberId: number;
  firstName: string;
  lastName: string;
  slot: string;
  slotLabel: string;
  hasPaid: boolean;
  payment?: {
    amount: number;
    paymentDate: string;
    paymentType: 'cash' | 'bank_transfer';
    senderBank?: string;
    receiverBank?: string;
    status: 'not_paid' | 'pending' | 'received' | 'settled';
  } | null;
}

export interface MemberSlot {
  groupId: number;
  groupName: string;
  monthlyAmount: number;
  duration: number;
  receiveMonth: string;
  slot: string;
  totalAmount: number;
  paymentStatus: string;
}

export interface AnalyticsStats {
  totalExpectedAmount: number;
  totalPaid: number;
  totalReceived: number;
  totalPending: number;
  dsbMembers: number;
  finabankMembers: number;
  cashMembers: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'administrator' | 'super_user' | 'normal_user';
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  created_by_username?: string;
  userType?: 'system' | 'member';
  memberId?: number; // For member users
  firstName?: string; // For member users
  lastName?: string; // For member users
  profilePicture?: string; // Profile picture URL
  initialPassword?: string; // Initial password for new users
}

export interface UserLog {
  id: number;
  userId: number;
  action: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  username?: string;
  email?: string;
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

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// Payment Log interface
export interface PaymentLog {
  id: number;
  payment_id?: number;
  action: 'created' | 'status_changed' | 'updated' | 'deleted' | 'bulk_created' | 'restored' | 'permanently_deleted';
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