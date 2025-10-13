-- Update campaigns table to use total clicks instead of daily cap
-- This migration:
-- 1. Drops the check constraint on daily_cap
-- 2. Renames daily_cap to total_clicks
-- 3. Adds clicks_served to track completed clicks
-- 4. Adds new check constraint

-- Step 1: Drop the existing check constraint on daily_cap
ALTER TABLE campaigns DROP CHECK campaigns_chk_2;

-- Step 2: Rename daily_cap to total_clicks
ALTER TABLE campaigns
  CHANGE COLUMN daily_cap total_clicks INT NOT NULL;

-- Step 3: Add clicks_served column to track how many clicks have been completed
ALTER TABLE campaigns
  ADD COLUMN clicks_served INT NOT NULL DEFAULT 0 AFTER total_clicks;

-- Step 4: Add new check constraint for total_clicks (minimum 1)
ALTER TABLE campaigns
  ADD CONSTRAINT chk_total_clicks CHECK (total_clicks >= 1);

-- Step 5: Add index for efficient querying
ALTER TABLE campaigns
  ADD INDEX idx_clicks_served (clicks_served);
