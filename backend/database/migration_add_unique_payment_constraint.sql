-- Migration: Add unique constraint to prevent duplicate payments
-- This ensures only one payment can exist per group, member, slot, and payment month combination
-- Duplicate = Payment Month = Receive Month = Member Name = Group

-- Drop the old constraint if it exists
DROP INDEX IF EXISTS idx_payments_unique_slot;

-- Add new unique constraint to payments table
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_payment 
ON payments(groupId, memberId, slot, paymentMonth); 