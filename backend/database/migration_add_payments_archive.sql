-- Migration: Add payments_archive table for archiving payments
-- Date: 2025-08-06

-- Create payments_archive table
CREATE TABLE IF NOT EXISTS payments_archive (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_id INTEGER NOT NULL, -- Reference to the original payment ID
    groupId INTEGER NOT NULL,
    memberId INTEGER NOT NULL,
    amount REAL NOT NULL,
    paymentDate TEXT NOT NULL,
    paymentMonth TEXT NOT NULL,
    slot TEXT,
    paymentType TEXT NOT NULL CHECK (paymentType IN ('cash', 'bank_transfer')),
    senderBank TEXT,
    receiverBank TEXT,
    status TEXT NOT NULL CHECK (status IN ('not_paid', 'pending', 'received', 'settled')),
    proofOfPayment TEXT,
    archived_at TEXT NOT NULL DEFAULT (datetime('now')),
    archived_by_user_id INTEGER,
    archived_by_username TEXT,
    archive_reason TEXT, -- Reason for archiving (optional)
    FOREIGN KEY (groupId) REFERENCES groups (id),
    FOREIGN KEY (memberId) REFERENCES members (id),
    FOREIGN KEY (archived_by_user_id) REFERENCES users (id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_archive_original_id ON payments_archive (original_id);
CREATE INDEX IF NOT EXISTS idx_payments_archive_archived_at ON payments_archive (archived_at);
CREATE INDEX IF NOT EXISTS idx_payments_archive_group_id ON payments_archive (groupId);
CREATE INDEX IF NOT EXISTS idx_payments_archive_member_id ON payments_archive (memberId); 