-- Migration: Update payment deletion trigger to allow deletion for archiving
-- Date: 2025-08-06

-- Drop the existing trigger
DROP TRIGGER IF EXISTS prevent_payment_deletion;

-- Create a new trigger that allows deletion when data exists in trashbox OR archive
CREATE TRIGGER IF NOT EXISTS prevent_payment_deletion
    BEFORE DELETE ON payments
    FOR EACH ROW
BEGIN
    SELECT CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM payments_trashbox 
            WHERE original_id = OLD.id
        ) AND NOT EXISTS (
            SELECT 1 FROM payments_archive 
            WHERE original_id = OLD.id
        ) THEN
            RAISE (ABORT, 'Direct deletion not allowed. Use soft delete or archive instead.')
    END;
END;