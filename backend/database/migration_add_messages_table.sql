-- Migration: Add messages table
-- This table stores member requests for account changes and deletions

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    member_name TEXT NOT NULL,
    member_email TEXT,
    member_phone TEXT,
    request_type TEXT NOT NULL CHECK(request_type IN ('delete_account', 'change_info')),
    request_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_member_id ON messages(member_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_request_type ON messages(request_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at); 