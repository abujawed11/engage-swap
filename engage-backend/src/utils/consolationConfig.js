/**
 * Consolation Reward Configuration
 * Platform-funded goodwill rewards when campaign exhausts at commit time
 */

const CONSOLATION_CONFIG = {
  // Default consolation amount (DECIMAL 20,3)
  DEFAULT_AMOUNT: 1.000,

  // Per-user limits
  USER_DAILY_LIMIT: 3, // Max 3 consolations per user per 24h
  USER_CAMPAIGN_COOLDOWN_HOURS: 12, // 1 consolation per campaign per 12h

  // Per-campaign limits
  CAMPAIGN_DAILY_LIMIT: 10, // Max 10 consolations per campaign per day

  // Global platform limits
  GLOBAL_DAILY_BUDGET: 100.000, // Max 100 coins per day for all consolations

  // Reasons for consolation
  REASON: {
    EXHAUSTED_VISITS_CAP: 'EXHAUSTED_VISITS_CAP',
    EXHAUSTED_COINS: 'EXHAUSTED_COINS',
  },
};

module.exports = CONSOLATION_CONFIG;
