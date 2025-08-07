-- Migration: Allow members to be added to the same group multiple times
-- This removes the UNIQUE(groupId, memberId) constraint while keeping UNIQUE(groupId, receiveMonth)

-- Create a new table with the updated schema
CREATE TABLE group_members_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupId INTEGER NOT NULL,
    memberId INTEGER NOT NULL,
    receiveMonth TEXT NOT NULL,
    joinedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE(groupId, receiveMonth)
);

-- Copy existing data
INSERT INTO group_members_new 
SELECT id, groupId, memberId, receiveMonth, joinedAt 
FROM group_members;

-- Drop the old table
DROP TABLE group_members;

-- Rename the new table
ALTER TABLE group_members_new RENAME TO group_members;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_group_members_groupId ON group_members(groupId);
CREATE INDEX IF NOT EXISTS idx_group_members_memberId ON group_members(memberId); 