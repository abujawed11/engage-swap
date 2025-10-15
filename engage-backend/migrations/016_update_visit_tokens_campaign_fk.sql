/**
 * Migration: Update visit_tokens foreign key to allow campaign deletion without cascade
 * This allows consolation rewards to be issued even after campaign is deleted
 */

-- Drop existing foreign key constraint for campaign_id
ALTER TABLE visit_tokens
DROP FOREIGN KEY visit_tokens_ibfk_2;

-- Make campaign_id nullable (needed for SET NULL)
ALTER TABLE visit_tokens
MODIFY COLUMN campaign_id BIGINT NULL;

-- Recreate foreign key with SET NULL on delete instead of CASCADE
ALTER TABLE visit_tokens
ADD CONSTRAINT visit_tokens_ibfk_2
FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
