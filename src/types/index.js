/**
 * @typedef {Object} Member
 * @property {number} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} birthDate
 * @property {string} birthplace
 * @property {string} address
 * @property {string} city
 * @property {string} phoneNumber
 * @property {string} email
 * @property {string} nationalId
 * @property {string} nationality
 * @property {string} occupation
 * @property {string} bankName
 * @property {string} accountNumber
 * @property {string} registrationDate
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Group
 * @property {number} id
 * @property {string} name
 * @property {number} monthlyAmount
 * @property {number} maxMembers
 * @property {number} duration
 * @property {string} startMonth
 * @property {string} endMonth
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} [status]
 * @property {number} [pendingCount]
 */

/**
 * @typedef {'not_paid' | 'pending' | 'fully_paid'} GroupStatus
 */

/**
 * @typedef {Object} GroupMember
 * @property {number} id
 * @property {number} groupId
 * @property {number} memberId
 * @property {string} receiveMonth
 * @property {string} joinedAt
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [phoneNumber]
 * @property {string} [bankName]
 * @property {string} [accountNumber]
 * @property {string} [nationalId]
 * @property {Member} [member]
 * @property {Group} [group]
 */

/**
 * @typedef {Object} Payment
 * @property {number} id
 * @property {number} groupId
 * @property {number} memberId
 * @property {number} amount
 * @property {string} paymentDate
 * @property {string} paymentMonth
 * @property {string} slot - The specific month/slot this payment is for (YYYY-MM format)
 * @property {'cash' | 'bank_transfer'} paymentType
 * @property {string} [senderBank]
 * @property {string} [receiverBank]
 * @property {'not_paid' | 'pending' | 'received' | 'settled'} status
 * @property {string} [proofOfPayment]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {Member} [member]
 * @property {Group} [group]
 */

/**
 * @typedef {Object} PaymentRequest
 * @property {number} [id]
 * @property {number} memberId
 * @property {number} groupId
 * @property {number} amount
 * @property {string} paymentDate
 * @property {string} paymentMonth
 * @property {string} slot - The specific month/slot this payment is for (YYYY-MM format)
 * @property {'cash' | 'bank_transfer'} paymentType
 * @property {string} [senderBank]
 * @property {string} [receiverBank]
 * @property {string} [proofOfPayment]
 * @property {'pending_approval' | 'approved' | 'rejected'} status
 * @property {string} [requestNotes]
 * @property {string} [adminNotes]
 * @property {number} [reviewedBy]
 * @property {string} [reviewedAt]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 * @property {Member} [member]
 * @property {Group} [group]
 * @property {User} [reviewer]
 */

/**
 * @typedef {Object} TrashboxPayment
 * @property {number} id
 * @property {number} original_id
 * @property {number} groupId
 * @property {number} memberId
 * @property {number} amount
 * @property {string} paymentDate
 * @property {string} paymentMonth
 * @property {string} slot
 * @property {'cash' | 'bank_transfer'} paymentType
 * @property {string} [senderBank]
 * @property {string} [receiverBank]
 * @property {'not_paid' | 'pending' | 'received' | 'settled'} status
 * @property {string} [proofOfPayment]
 * @property {string} deleted_at
 * @property {number} [deleted_by_user_id]
 * @property {string} [deleted_by_username]
 * @property {string} [restore_reason]
 * @property {Member} [member]
 * @property {Group} [group]
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} totalMembers
 * @property {number} totalGroups
 * @property {number} totalPayments
 * @property {number} totalAmountPaid
 * @property {number} totalAmountReceived
 * @property {number} totalAmountExpected
 * @property {number} overduePayments
 * @property {number} pendingPayments
 * @property {number} pendingAmount
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {*} [data]
 * @property {string} [error]
 * @property {string} [message]
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array} data
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 * @property {number} totalPages
 */

/**
 * @typedef {Object} MonthlyTrend
 * @property {string} month
 * @property {number} amountPaid
 * @property {number} amountReceived
 * @property {number} paymentCount
 */

/**
 * @typedef {Object} GroupPerformance
 * @property {number} groupId
 * @property {string} groupName
 * @property {number} totalMembers
 * @property {number} totalAmount
 * @property {number} completionPercentage
 */

/**
 * @typedef {Object} RecentActivity
 * @property {number} id
 * @property {'payment' | 'member_added' | 'group_created'} type
 * @property {string} description
 * @property {number} [amount]
 * @property {string} date
 */

/**
 * @typedef {Object} GroupWithCurrentRecipient
 * @property {number} id
 * @property {string} name
 * @property {number} monthlyAmount
 * @property {string|null} receiveMonth
 * @property {string|null} firstName
 * @property {string|null} lastName
 * @property {string|null} phoneNumber
 * @property {string|null} bankName
 * @property {string|null} accountNumber
 * @property {string} [status]
 * @property {number} [pendingCount]
 */

/**
 * @typedef {Object} Bank
 * @property {number} id
 * @property {string} bankName
 * @property {string} shortName
 * @property {string} bankAddress
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} GroupMemberSlot
 * @property {number} memberId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} slot
 * @property {string} slotLabel
 * @property {boolean} hasPaid
 * @property {Object|null} [payment]
 * @property {number} payment.amount
 * @property {string} payment.paymentDate
 * @property {'cash' | 'bank_transfer'} payment.paymentType
 * @property {string} [payment.senderBank]
 * @property {string} [payment.receiverBank]
 * @property {'not_paid' | 'pending' | 'received' | 'settled'} payment.status
 */

/**
 * @typedef {Object} MemberSlot
 * @property {number} groupId
 * @property {string} groupName
 * @property {number} monthlyAmount
 * @property {number} duration
 * @property {string} receiveMonth
 * @property {string} slot
 * @property {number} totalAmount
 * @property {string} paymentStatus
 */

/**
 * @typedef {Object} AnalyticsStats
 * @property {number} totalExpectedAmount
 * @property {number} totalPaid
 * @property {number} totalReceived
 * @property {number} totalPending
 * @property {number} dsbMembers
 * @property {number} finabankMembers
 * @property {number} cashMembers
 */

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} [email]
 * @property {'administrator' | 'super_user' | 'normal_user'} role
 * @property {boolean} is_active
 * @property {string} [last_login]
 * @property {string} [created_at]
 * @property {string} [created_by_username]
 * @property {'system' | 'member'} [userType]
 * @property {number} [memberId] - For member users
 * @property {string} [firstName] - For member users
 * @property {string} [lastName] - For member users
 * @property {string} [profilePicture] - Profile picture URL
 * @property {string} [initialPassword] - Initial password for new users
 */

/**
 * @typedef {Object} UserLog
 * @property {number} id
 * @property {number} userId
 * @property {string} action
 * @property {string} ipAddress
 * @property {string} userAgent
 * @property {string} createdAt
 * @property {string} [username]
 * @property {string} [email]
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} CreateUserRequest
 * @property {string} username
 * @property {string} email
 * @property {string} password
 * @property {'administrator' | 'super_user' | 'normal_user'} role
 */

/**
 * @typedef {Object} AuthState
 * @property {boolean} isAuthenticated
 * @property {User|null} user
 * @property {string|null} token
 */

/**
 * @typedef {Object} PaymentLog
 * @property {number} id
 * @property {number} [payment_id]
 * @property {'created' | 'status_changed' | 'updated' | 'deleted' | 'bulk_created' | 'restored' | 'permanently_deleted'} action
 * @property {'not_paid' | 'pending' | 'received' | 'settled'} [old_status]
 * @property {'not_paid' | 'pending' | 'received' | 'settled'} [new_status]
 * @property {number} [old_amount]
 * @property {number} [new_amount]
 * @property {string} [old_payment_date]
 * @property {string} [new_payment_date]
 * @property {string} [old_payment_month]
 * @property {string} [new_payment_month]
 * @property {'cash' | 'bank_transfer'} [old_payment_type]
 * @property {'cash' | 'bank_transfer'} [new_payment_type]
 * @property {string} [old_sender_bank]
 * @property {string} [new_sender_bank]
 * @property {string} [old_receiver_bank]
 * @property {string} [new_receiver_bank]
 * @property {string} [old_proof_of_payment]
 * @property {string} [new_proof_of_payment]
 * @property {number} [member_id]
 * @property {number} [group_id]
 * @property {number} [bulk_payment_count]
 * @property {string} [details]
 * @property {number} [performed_by_user_id]
 * @property {string} [performed_by_username]
 * @property {string} timestamp
 * @property {string} [ip_address]
 * @property {string} [user_agent]
 * @property {Member} [member] - Joined member data
 * @property {Group} [group] - Joined group data
 * @property {Payment} [payment] - Joined payment data
 */

// Export types for use in other files
export {};
