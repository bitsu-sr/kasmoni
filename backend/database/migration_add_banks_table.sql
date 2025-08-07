-- Migration: Add Banks Table
-- Date: 2024-01-XX
-- Description: Add banks table for managing bank information

-- Banks table
CREATE TABLE IF NOT EXISTS banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bankName TEXT NOT NULL UNIQUE,
    shortName TEXT NOT NULL UNIQUE,
    bankAddress TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_banks_bankName ON banks(bankName);
CREATE INDEX IF NOT EXISTS idx_banks_shortName ON banks(shortName);

-- Insert some sample banks
INSERT OR IGNORE INTO banks (bankName, shortName, bankAddress) VALUES
('De Surinaamsche Bank', 'DSB', 'Waterkant 1, Paramaribo, Suriname'),
('Finabank', 'FINABANK', 'Domineestraat 25, Paramaribo, Suriname'),
('Hakrinbank', 'HAKRINBANK', 'Dr. Sophie Redmondstraat 42, Paramaribo, Suriname'),
('Surinaamse Volkscredietbank', 'SVCB', 'Grote Combeweg 15, Paramaribo, Suriname'),
('Surinaamse Postspaarbank', 'SPSB', 'Kleine Waterstraat 8, Paramaribo, Suriname'); 