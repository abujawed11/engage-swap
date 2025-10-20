-- Migration 029: Add Snapshot Fields to Visits Table
-- Captures campaign details at visit time for historical integrity

-- Add snapshot fields to visits table
ALTER TABLE `visits`
  ADD COLUMN `campaign_title_snapshot` VARCHAR(120) NULL COMMENT 'Campaign title captured at visit time',
  ADD COLUMN `campaign_url_snapshot` VARCHAR(512) NULL COMMENT 'Campaign URL captured at visit time';

-- Update foreign key constraint to prevent cascade delete
-- First, drop the existing foreign key
ALTER TABLE `visits` DROP FOREIGN KEY `visits_ibfk_2`;

-- Re-add with RESTRICT to prevent accidental campaign deletion
ALTER TABLE `visits`
  ADD CONSTRAINT `visits_ibfk_2`
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE RESTRICT;

-- Backfill existing visits with snapshot data from campaigns table (optional)
-- This helps maintain consistency for historical data
UPDATE `visits` v
INNER JOIN `campaigns` c ON v.campaign_id = c.id
SET
  v.campaign_title_snapshot = c.title,
  v.campaign_url_snapshot = c.url
WHERE v.campaign_title_snapshot IS NULL;

-- Verification query
SELECT
  COUNT(*) as total_visits,
  COUNT(campaign_title_snapshot) as visits_with_title_snapshot,
  COUNT(campaign_url_snapshot) as visits_with_url_snapshot
FROM `visits`;
