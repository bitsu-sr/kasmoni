-- Sranan Kasmoni Database Schema
-- Rotating Savings Management Application

-- Members table
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    birthDate TEXT NOT NULL,
    birthplace TEXT,
    address TEXT,
    city TEXT,
    phoneNumber TEXT NOT NULL,
    email TEXT UNIQUE,
    nationalId TEXT UNIQUE NOT NULL,
    nationality TEXT,
    occupation TEXT,
    bankName TEXT,
    accountNumber TEXT,
    registrationDate TEXT DEFAULT (date('now')),
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    monthlyAmount DECIMAL(10,2) NOT NULL,
    maxMembers INTEGER NOT NULL DEFAULT 12,
    duration INTEGER NOT NULL,
    startMonth TEXT NOT NULL,
    endMonth TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

-- Group Members table (junction table)
CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupId INTEGER NOT NULL,
    memberId INTEGER NOT NULL,
    receiveMonth TEXT NOT NULL,
    joinedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE(groupId, receiveMonth)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupId INTEGER NOT NULL,
    memberId INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paymentDate TEXT NOT NULL,
    paymentMonth TEXT NOT NULL,
    slot TEXT NOT NULL, -- The specific month/slot this payment is for (YYYY-MM format)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_nationalId ON members(nationalId);
CREATE INDEX IF NOT EXISTS idx_group_members_groupId ON group_members(groupId);
CREATE INDEX IF NOT EXISTS idx_group_members_memberId ON group_members(memberId);
CREATE INDEX IF NOT EXISTS idx_payments_groupId ON payments(groupId);
CREATE INDEX IF NOT EXISTS idx_payments_memberId ON payments(memberId);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paymentDate ON payments(paymentDate); 