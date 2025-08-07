-- Migration to add payment_notification to allowed request types
-- Drop the existing CHECK constraint
PRAGMA foreign_keys=OFF;

-- Create a new table with the updated constraint
CREATE TABLE messages_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    member_name TEXT NOT NULL,
    member_email TEXT,
    member_phone TEXT,
    request_type TEXT NOT NULL CHECK(request_type IN ('delete_account', 'change_info', 'payment_notification')),
    request_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Copy data from the old table
INSERT INTO messages_new SELECT * FROM messages;

-- Drop the old table
DROP TABLE messages;

-- Rename the new table
ALTER TABLE messages_new RENAME TO messages;

-- Recreate indexes
CREATE INDEX idx_messages_member_id ON messages(member_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_request_type ON messages(request_type);
CREATE INDEX idx_messages_created_at ON messages(created_at);

PRAGMA foreign_keys=ON; 