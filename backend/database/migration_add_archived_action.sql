-- Migration: Add 'archived' action to payment_logs table
-- Date: 2025-08-06

-- SQLite doesn't support ALTER TABLE for CHECK constraints, so we need to recreate the table

-- Step 1: Create a new table with the updated CHECK constraint
CREATE TABLE IF NOT EXISTS payment_logs_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER,
    action TEXT NOT NULL CHECK (action IN ('created', 'status_changed', 'updated', 'deleted', 'bulk_created', 'restored', 'permanently_deleted', 'archived')),
    old_status TEXT CHECK (old_status IN ('not_paid', 'pending', 'received', 'settled')),
    new_status TEXT CHECK (new_status IN ('not_paid', 'pending', 'received', 'settled')),
    old_amount REAL,
    new_amount REAL,
    old_payment_date TEXT,
    new_payment_date TEXT,
    old_payment_month TEXT,
    new_payment_month TEXT,
    old_payment_type TEXT CHECK (old_payment_type IN ('cash', 'bank_transfer')),
    new_payment_type TEXT CHECK (new_payment_type IN ('cash', 'bank_transfer')),
    old_sender_bank TEXT,
    new_sender_bank TEXT,
    old_receiver_bank TEXT,
    new_receiver_bank TEXT,
    old_proof_of_payment TEXT,
    new_proof_of_payment TEXT,
    member_id INTEGER,
    group_id INTEGER,
    bulk_payment_count INTEGER, -- For bulk operations
    details TEXT, -- Additional details about the action
    performed_by_user_id INTEGER,
    performed_by_username TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (payment_id) REFERENCES payments (id),
    FOREIGN KEY (member_id) REFERENCES members (id),
    FOREIGN KEY (group_id) REFERENCES groups (id),
    FOREIGN KEY (performed_by_user_id) REFERENCES users (id)
);

-- Step 2: Copy data from old table to new table
INSERT INTO payment_logs_new SELECT * FROM payment_logs;

-- Step 3: Drop the old table
DROP TABLE payment_logs;

-- Step 4: Rename the new table
ALTER TABLE payment_logs_new RENAME TO payment_logs;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs (payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_action ON payment_logs (action);
CREATE INDEX IF NOT EXISTS idx_payment_logs_timestamp ON payment_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_payment_logs_performed_by ON payment_logs (performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_member_id ON payment_logs (member_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_group_id ON payment_logs (group_id);