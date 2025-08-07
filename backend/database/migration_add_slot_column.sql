-- Migration: Add slot column to payments table
-- This migration adds a slot column to track which month/slot each payment is for

-- Add the slot column to the payments table
ALTER TABLE payments ADD COLUMN slot TEXT NOT NULL DEFAULT '';

-- Update existing payments to use paymentMonth as the slot value
UPDATE payments SET slot = paymentMonth WHERE slot = '';

-- Create an index for better performance on slot queries
CREATE INDEX IF NOT EXISTS idx_payments_slot ON payments(slot);