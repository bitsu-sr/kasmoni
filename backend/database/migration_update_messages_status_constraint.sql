-- Migration: Update messages table status constraint to allow 'read' status
-- Date: 2025-08-07

-- First, drop the existing constraint
PRAGMA foreign_keys=OFF;

-- Create a temporary table with the new constraint
CREATE TABLE messages_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    member_name TEXT NOT NULL,
    member_email TEXT NOT NULL,
    member_phone TEXT NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('delete_account', 'change_info', 'payment_notification')),
    request_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'read')),
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Copy data from old table to new table
INSERT INTO messages_new SELECT * FROM messages;

-- Drop the old table
DROP TABLE messages;

-- Rename the new table to the original name
ALTER TABLE messages_new RENAME TO messages;

-- Recreate indexes
CREATE INDEX idx_messages_member_id ON messages(member_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at);

PRAGMA foreign_keys=ON; 