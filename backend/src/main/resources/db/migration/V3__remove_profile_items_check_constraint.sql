-- ================================================
-- Remove CHECK constraint on profile_items.unlock_condition_type
-- to allow AVATAR_PURCHASE enum value
-- ================================================

ALTER TABLE profile_items
DROP CONSTRAINT IF EXISTS profile_items_unlock_condition_type_check;
