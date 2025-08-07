-- Migration: Fix payment deletion trigger to allow soft delete
-- Date: 2025-08-05

-- Drop the existing trigger
DROP TRIGGER IF EXISTS prevent_payment_deletion;

-- Create a new trigger that allows deletion only when data exists in trashbox
CREATE TRIGGER IF NOT EXISTS prevent_payment_deletion
    BEFORE DELETE ON payments
    FOR EACH ROW
BEGIN
    SELECT CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM payments_trashbox 
            WHERE original_id = OLD.id
        ) THEN
            RAISE (ABORT, 'Direct deletion not allowed. Use soft delete instead.')
    END;
END; 