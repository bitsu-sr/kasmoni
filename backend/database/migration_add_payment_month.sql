-- Migration: Add paymentMonth column to payments table
-- This migration adds the paymentMonth column to store month and year for payments

-- Add the new column
ALTER TABLE payments ADD COLUMN paymentMonth TEXT;

-- Update existing records to set paymentMonth based on paymentDate
-- Extract year and month from paymentDate and format as YYYY-MM
UPDATE payments 
SET paymentMonth = strftime('%Y-%m', paymentDate) 
WHERE paymentMonth IS NULL;

-- Make the column NOT NULL after updating existing data
-- Note: SQLite doesn't support ALTER COLUMN NOT NULL, so we need to recreate the table
-- This is a simplified approach - in production, you might want to handle this differently

-- Create a temporary table with the new schema
CREATE TABLE payments_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupId INTEGER NOT NULL,
    memberId INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paymentDate TEXT NOT NULL,
    paymentMonth TEXT NOT NULL,
    paymentType TEXT NOT NULL CHECK (paymentType IN ('cash', 'bank_transfer')),
    senderBank TEXT,
    receiverBank TEXT,
    status TEXT NOT NULL DEFAULT 'not_paid' CHECK (status IN ('not_paid', 'pending', 'received', 'settled')),
    proofOfPayment TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
);

-- Copy data from old table to new table
INSERT INTO payments_temp 
SELECT id, groupId, memberId, amount, paymentDate, paymentMonth, paymentType, 
       senderBank, receiverBank, status, proofOfPayment, createdAt, updatedAt
FROM payments;

-- Drop the old table
DROP TABLE payments;

-- Rename the new table to the original name
ALTER TABLE payments_temp RENAME TO payments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_payments_groupId ON payments(groupId);
CREATE INDEX IF NOT EXISTS idx_payments_memberId ON payments(memberId);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paymentDate ON payments(paymentDate);
CREATE INDEX IF NOT EXISTS idx_payments_paymentMonth ON payments(paymentMonth); 