-- Add constraint to prevent negative coins
-- This ensures coins can never go below 0 at the database level

ALTER TABLE users
ADD CONSTRAINT chk_coins_non_negative
CHECK (coins >= 0);
