-- Add is_finished status to campaigns table
-- This allows campaigns to be marked as finished when they reach their total clicks
-- and provides a re-add option for campaigners

ALTER TABLE campaigns
  ADD COLUMN is_finished TINYINT(1) NOT NULL DEFAULT 0 AFTER is_paused;

-- Add index for efficient querying of active campaigns
ALTER TABLE campaigns
  ADD INDEX idx_is_finished (is_finished);

-- Update existing campaigns that have reached their total clicks to be finished
UPDATE campaigns
SET is_finished = 1
WHERE clicks_served >= total_clicks;
