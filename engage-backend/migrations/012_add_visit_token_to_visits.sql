-- Migration: Add visit_token to visits table
-- This allows linking visits to quiz_attempts for reward tracking

ALTER TABLE visits
  ADD COLUMN visit_token VARCHAR(64) NULL AFTER public_id,
  ADD INDEX idx_visit_token (visit_token);

-- Note: Existing visits will have NULL visit_token (pre-quiz system)
-- New visits will have visit_token populated for quiz tracking
