/**
 * Migration: Add CAMPAIGN_PAUSED and CAMPAIGN_DELETED to consolation_rewards.reason ENUM
 * Extends consolation system to handle interrupted campaigns
 */

ALTER TABLE consolation_rewards
MODIFY COLUMN reason ENUM(
  'EXHAUSTED_VISITS_CAP',
  'EXHAUSTED_COINS',
  'CAMPAIGN_PAUSED',
  'CAMPAIGN_DELETED'
) NOT NULL;
