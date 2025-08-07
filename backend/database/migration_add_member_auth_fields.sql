-- Add missing authentication fields to members table
ALTER TABLE members ADD COLUMN username VARCHAR(50) UNIQUE;
ALTER TABLE members ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE members ADD COLUMN role TEXT CHECK(role IN ('administrator', 'super_user', 'normal_user')) DEFAULT 'normal_user';
ALTER TABLE members ADD COLUMN is_active BOOLEAN DEFAULT 1;
ALTER TABLE members ADD COLUMN last_login DATETIME;
ALTER TABLE members ADD COLUMN user_created_at DATETIME;
ALTER TABLE members ADD COLUMN user_updated_at DATETIME;

-- Create indexes for faster lookups
CREATE INDEX idx_members_username ON members(username);
CREATE INDEX idx_members_role ON members(role);
CREATE INDEX idx_members_is_active ON members(is_active); 