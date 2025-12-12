-- ================================================
-- Make gold_package_id nullable in payment_history
-- Date: 2025-12-12
-- Reason: Direct payment requests don't require a gold package
-- ================================================

ALTER TABLE payment_history
ALTER COLUMN gold_package_id DROP NOT NULL;
