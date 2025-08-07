-- Migration: Add payments_trashbox table for soft deletion
-- Date: 2025-07-31

-- Create payments_trashbox table
CREATE TABLE IF NOT EXISTS payments_trashbox (
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
    deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_by_user_id INTEGER,
    deleted_by_username TEXT,
    restore_reason TEXT, -- Reason for deletion (optional)
    FOREIGN KEY (groupId) REFERENCES groups (id),
    FOREIGN KEY (memberId) REFERENCES members (id),
    FOREIGN KEY (deleted_by_user_id) REFERENCES users (id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_trashbox_original_id ON payments_trashbox (original_id);
CREATE INDEX IF NOT EXISTS idx_payments_trashbox_deleted_at ON payments_trashbox (deleted_at);
CREATE INDEX IF NOT EXISTS idx_payments_trashbox_group_id ON payments_trashbox (groupId);
CREATE INDEX IF NOT EXISTS idx_payments_trashbox_member_id ON payments_trashbox (memberId);

-- Add trigger to prevent direct deletion from payments table
-- This ensures all deletions go through the soft delete process
CREATE TRIGGER IF NOT EXISTS prevent_payment_deletion
    BEFORE DELETE ON payments
    FOR EACH ROW
BEGIN
    SELECT CASE 
        WHEN OLD.id IS NOT NULL THEN
            RAISE (ABORT, 'Direct deletion not allowed. Use soft delete instead.')
    END;
END; 