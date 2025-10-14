-- Migration: Add watch duration feature and decimal coin support
-- This migration:
-- 1. Converts all INT coin columns to DECIMAL(20,3) for fractional coin support
-- 2. Adds watch_duration column to campaigns (30-120 seconds, 15s increments)
-- 3. Updates check constraints

-- Step 1: Add watch_duration column to campaigns table
-- Default to 30 seconds (minimum watch time)
-- Allowed values: 30, 45, 60, 75, 90, 105, 120 (15-second increments)
ALTER TABLE campaigns
  ADD COLUMN watch_duration INT NOT NULL DEFAULT 30 AFTER coins_per_visit;

-- Step 2: Add check constraint for watch_duration
ALTER TABLE campaigns
  ADD CONSTRAINT chk_watch_duration
  CHECK (watch_duration >= 30 AND watch_duration <= 120 AND (watch_duration - 30) % 15 = 0);

-- Step 3: Convert coins column in users table to DECIMAL(20,3)
ALTER TABLE users
  MODIFY COLUMN coins DECIMAL(20,3) NOT NULL DEFAULT 0.000;

-- Step 4: Update check constraint for users.coins to work with DECIMAL
ALTER TABLE users DROP CHECK users_chk_1;
ALTER TABLE users
  ADD CONSTRAINT chk_user_coins CHECK (coins >= 0);

-- Step 5: Convert coins_per_visit in campaigns table to DECIMAL(20,3)
ALTER TABLE campaigns
  MODIFY COLUMN coins_per_visit DECIMAL(20,3) NOT NULL;

-- Step 6: Update check constraint for campaigns.coins_per_visit
ALTER TABLE campaigns DROP CHECK campaigns_chk_1;
ALTER TABLE campaigns
  ADD CONSTRAINT chk_coins_per_visit CHECK (coins_per_visit >= 0.001);

-- Step 7: Convert coins_earned in visits table to DECIMAL(20,3)
ALTER TABLE visits
  MODIFY COLUMN coins_earned DECIMAL(20,3) NOT NULL;

-- Note: With watch_duration feature:
-- - Base cost (B) = coins_per_visit (set by campaigner)
-- - Extra cost = 5 × steps, where steps = (watch_duration - 30) / 15
-- - Total cost per visit = B + (5 × steps)
-- - Example: 60s watch time with B=10 → steps=2 → Extra=10 → Total=20 coins

-- Note: Decimal coin handling:
-- - Store as DECIMAL(20,3) for up to 3 decimal places precision
-- - Display with 1 decimal place by default (e.g., "15.6 coins")
-- - Display with 2 decimal places for values < 1 (e.g., "0.60 coins")
-- - Always round at ledger entry time (not during calculations)
