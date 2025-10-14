/**
 * Consolation Rewards Utility
 * Handles platform-funded goodwill rewards for campaign exhaustion
 */

const db = require('../db');
const CONSOLATION_CONFIG = require('./consolationConfig');
const { roundCoins } = require('./validation');

/**
 * Check if user is eligible for consolation reward
 * @param {Object} connection - Database connection (transaction)
 * @param {number} userId - User ID
 * @param {number} campaignId - Campaign ID
 * @param {string} visitToken - Visit token (for idempotency)
 * @returns {Object} { eligible: boolean, reason?: string }
 */
async function checkConsolationEligibility(connection, userId, campaignId, visitToken) {
  // 1. Check if visit already received consolation
  const [existingConsolation] = await connection.query(
    'SELECT id FROM consolation_rewards WHERE visit_token = ?',
    [visitToken]
  );

  if (existingConsolation.length > 0) {
    return { eligible: false, reason: 'Already received consolation for this visit' };
  }

  // 2. Check if visit already received normal reward
  const [existingVisit] = await connection.query(
    'SELECT id FROM visits WHERE visit_token = ?',
    [visitToken]
  );

  if (existingVisit.length > 0) {
    return { eligible: false, reason: 'Already received normal reward' };
  }

  // 3. Check user daily limit (rolling 24h)
  const [userDailyCount] = await connection.query(
    `SELECT COUNT(*) as count FROM consolation_rewards
     WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    [userId]
  );

  if (userDailyCount[0].count >= CONSOLATION_CONFIG.USER_DAILY_LIMIT) {
    return { eligible: false, reason: 'User daily consolation limit reached' };
  }

  // 4. Check user+campaign cooldown (12h)
  const [userCampaignRecent] = await connection.query(
    `SELECT id FROM consolation_rewards
     WHERE user_id = ? AND campaign_id = ?
     AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
     LIMIT 1`,
    [userId, campaignId, CONSOLATION_CONFIG.USER_CAMPAIGN_COOLDOWN_HOURS]
  );

  if (userCampaignRecent.length > 0) {
    return { eligible: false, reason: 'Cooldown period for this campaign not elapsed' };
  }

  // 5. Check campaign daily limit
  const today = new Date().toISOString().slice(0, 10);
  const [campaignDailyCount] = await connection.query(
    `SELECT COUNT(*) as count FROM consolation_rewards
     WHERE campaign_id = ? AND DATE(created_at) = ?`,
    [campaignId, today]
  );

  if (campaignDailyCount[0].count >= CONSOLATION_CONFIG.CAMPAIGN_DAILY_LIMIT) {
    return { eligible: false, reason: 'Campaign daily consolation limit reached' };
  }

  // 6. Check global daily budget
  const [globalDailySum] = await connection.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM consolation_rewards
     WHERE DATE(created_at) = ?`,
    [today]
  );

  const globalSpent = parseFloat(globalDailySum[0].total);
  if (globalSpent >= CONSOLATION_CONFIG.GLOBAL_DAILY_BUDGET) {
    return { eligible: false, reason: 'Platform daily consolation budget exceeded' };
  }

  return { eligible: true };
}

/**
 * Issue consolation reward
 * @param {Object} connection - Database connection (transaction)
 * @param {number} userId - User ID
 * @param {number} campaignId - Campaign ID
 * @param {string} visitToken - Visit token
 * @param {string} reason - Reason for consolation (EXHAUSTED_VISITS_CAP or EXHAUSTED_COINS)
 * @returns {Object} { success: boolean, amount: number, newBalance: number }
 */
async function issueConsolationReward(connection, userId, campaignId, visitToken, reason) {
  const amount = roundCoins(CONSOLATION_CONFIG.DEFAULT_AMOUNT);

  // 1. Credit coins to user
  await connection.query(
    'UPDATE users SET coins = coins + ? WHERE id = ?',
    [amount, userId]
  );

  // 2. Record consolation reward
  await connection.query(
    `INSERT INTO consolation_rewards (visit_token, campaign_id, user_id, amount, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [visitToken, campaignId, userId, amount, reason]
  );

  // 3. Get updated balance
  const [users] = await connection.query(
    'SELECT coins FROM users WHERE id = ?',
    [userId]
  );

  return {
    success: true,
    amount: amount,
    newBalance: users[0].coins,
  };
}

/**
 * Record failed visit with no reward (for analytics)
 * @param {Object} connection - Database connection (transaction)
 * @param {number} userId - User ID
 * @param {number} campaignId - Campaign ID
 * @param {number} campaignOwnerId - Campaign owner ID
 * @param {string} visitToken - Visit token
 * @param {string} publicId - Visit public ID
 */
async function recordFailedVisit(connection, userId, campaignId, campaignOwnerId, visitToken, publicId) {
  const today = new Date().toISOString().slice(0, 10);

  await connection.query(
    `INSERT INTO visits (user_id, campaign_id, campaign_owner_id, coins_earned, is_consolation, visit_date, visit_token, public_id)
     VALUES (?, ?, ?, 0.000, 0, ?, ?, ?)`,
    [userId, campaignId, campaignOwnerId, today, visitToken, publicId]
  );
}

module.exports = {
  checkConsolationEligibility,
  issueConsolationReward,
  recordFailedVisit,
  CONSOLATION_CONFIG,
};
