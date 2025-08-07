-- Migration: Add payment requests table for member payment request workflow
-- This allows members to submit payment requests that require admin approval

-- Payment Requests table
CREATE TABLE IF NOT EXISTS payment_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memberId INTEGER NOT NULL,
    groupId INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paymentDate TEXT NOT NULL,
    paymentMonth TEXT NOT NULL, -- Auto-set to current month, admins can change
    slot TEXT NOT NULL, -- The specific month/slot this payment is for (YYYY-MM format)
    paymentType TEXT NOT NULL CHECK (paymentType IN ('cash', 'bank_transfer')),
    senderBank TEXT,
    receiverBank TEXT,
    proofOfPayment TEXT,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
    requestNotes TEXT, -- Optional notes from member
    adminNotes TEXT, -- Admin notes during review
    reviewedBy INTEGER, -- Admin user ID who reviewed
    reviewedAt TEXT, -- When reviewed
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewedBy) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_memberId ON payment_requests(memberId);
CREATE INDEX IF NOT EXISTS idx_payment_requests_groupId ON payment_requests(groupId);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_createdAt ON payment_requests(createdAt);
CREATE INDEX IF NOT EXISTS idx_payment_requests_reviewedBy ON payment_requests(reviewedBy);