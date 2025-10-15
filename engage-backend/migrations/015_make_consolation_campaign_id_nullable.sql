/**
 * Migration: Make campaign_id nullable in consolation_rewards
 * Allows consolation rewards for deleted campaigns (no FK reference needed)
 */

-- Drop existing foreign key constraint
ALTER TABLE consolation_rewards
DROP FOREIGN KEY consolation_rewards_ibfk_2;

-- Make campaign_id nullable
ALTER TABLE consolation_rewards
MODIFY COLUMN campaign_id BIGINT NULL;

-- Recreate foreign key with SET NULL on delete instead of CASCADE
ALTER TABLE consolation_rewards
ADD CONSTRAINT consolation_rewards_ibfk_2
FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
