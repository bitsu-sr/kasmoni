-- Migration: Add users table
-- Date: 2025-08-03

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role TEXT CHECK(role IN ('administrator', 'super_user', 'normal_user')) NOT NULL DEFAULT 'normal_user',
  created_by INTEGER,
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Insert default administrator user (password: admin123)
INSERT OR IGNORE INTO users (username, email, password_hash, role, created_by) 
VALUES ('admin', 'admin@kasmoni.com', '$2b$10$greUxRUvHmaX56CA23bn.uqjzCi8gjDGD.tkPElK4M1od.24e6x5W', 'administrator', NULL); 