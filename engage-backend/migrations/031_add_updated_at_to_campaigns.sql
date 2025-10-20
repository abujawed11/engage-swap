-- Migration 031: Add updated_at column to campaigns table
-- Tracks when a campaign was last modified

-- Add updated_at column
ALTER TABLE `campaigns`
  ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  COMMENT 'Timestamp of last update to campaign' AFTER `created_at`;

-- Add index for sorting
ALTER TABLE `campaigns`
  ADD INDEX `idx_updated_at` (`updated_at`);

-- Backfill: Set updated_at to created_at for existing campaigns
UPDATE `campaigns`
SET `updated_at` = `created_at`
WHERE `updated_at` IS NULL OR `updated_at` = '0000-00-00 00:00:00';

-- For deleted campaigns, set updated_at to deleted_at if deleted_at exists
UPDATE `campaigns`
SET `updated_at` = `deleted_at`
WHERE `deleted_at` IS NOT NULL;

-- Verification query
SELECT
  COUNT(*) as total_campaigns,
  COUNT(updated_at) as campaigns_with_updated_at,
  MIN(updated_at) as earliest_updated,
  MAX(updated_at) as latest_updated
FROM `campaigns`;
