const db = require('../db');

/**
 * Campaign Analytics and Observability Utilities
 * Provides dashboard metrics and analytics queries
 */

/**
 * Get enforcement statistics for dashboard
 * @param {Date} startDate - Start date for analysis
 * @param {Date} endDate - End date for analysis
 * @returns {Promise<object>} - Aggregated enforcement statistics
 */
async function getEnforcementStatistics(startDate = null, endDate = null) {
  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago
  const end = endDate || new Date();

  // Overall enforcement outcomes
  const [outcomeStats] = await db.query(
    `SELECT
       outcome,
       value_tier,
       COUNT(*) as count,
       COUNT(DISTINCT user_id) as unique_users,
       COUNT(DISTINCT campaign_id) as unique_campaigns
     FROM campaign_enforcement_logs
     WHERE created_at BETWEEN ? AND ?
     GROUP BY outcome, value_tier
     ORDER BY outcome, value_tier`,
    [start, end]
  );

  // Average attempts per user per campaign
  const [avgAttempts] = await db.query(
    `SELECT
       AVG(attempt_count_24h) as avg_attempts_per_user_per_campaign,
       MAX(attempt_count_24h) as max_attempts_per_user_per_campaign
     FROM campaign_enforcement_logs
     WHERE created_at BETWEEN ? AND ?`,
    [start, end]
  );

  // High-value limit blocks
  const [highValueBlocks] = await db.query(
    `SELECT COUNT(*) as high_value_limit_blocks
     FROM campaign_enforcement_logs
     WHERE created_at BETWEEN ? AND ?
       AND value_tier = 'HIGH'
       AND outcome = 'LIMIT_REACHED'`,
    [start, end]
  );

  // Cooldown triggers
  const [cooldownTriggers] = await db.query(
    `SELECT COUNT(*) as cooldown_triggers
     FROM campaign_enforcement_logs
     WHERE created_at BETWEEN ? AND ?
       AND outcome = 'COOLDOWN_ACTIVE'`,
    [start, end]
  );

  // Active session blocks
  const [activeSessionBlocks] = await db.query(
    `SELECT COUNT(*) as active_session_blocks
     FROM campaign_enforcement_logs
     WHERE created_at BETWEEN ? AND ?
       AND outcome = 'ACTIVE_SESSION_EXISTS'`,
    [start, end]
  );

  // Rotation window distribution
  const [rotationStats] = await db.query(
    `SELECT
       value_tier,
       COUNT(*) as total_serves,
       COUNT(DISTINCT user_id) as unique_users,
       COUNT(DISTINCT campaign_id) as unique_campaigns
     FROM campaign_rotation_tracking crt
     JOIN campaigns c ON crt.campaign_id = c.id
     WHERE crt.last_served_at BETWEEN ? AND ?
     GROUP BY CASE
       WHEN c.coins_per_visit >= 10 THEN 'HIGH'
       WHEN c.coins_per_visit >= 5 THEN 'MEDIUM'
       ELSE 'LOW'
     END`,
    [start, end]
  );

  return {
    period: {
      start,
      end,
    },
    outcome_statistics: outcomeStats,
    average_attempts: avgAttempts[0],
    high_value_limit_blocks: highValueBlocks[0].high_value_limit_blocks,
    cooldown_triggers: cooldownTriggers[0].cooldown_triggers,
    active_session_blocks: activeSessionBlocks[0].active_session_blocks,
    rotation_window_distribution: rotationStats,
  };
}

/**
 * Get per-campaign analytics
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<object>} - Campaign-specific analytics
 */
async function getCampaignAnalytics(campaignId) {
  // Enforcement stats for this campaign
  const [enforcementStats] = await db.query(
    `SELECT
       outcome,
       COUNT(*) as count,
       COUNT(DISTINCT user_id) as unique_users
     FROM campaign_enforcement_logs
     WHERE campaign_id = ?
     GROUP BY outcome`,
    [campaignId]
  );

  // User engagement distribution
  const [userEngagement] = await db.query(
    `SELECT
       user_id,
       attempt_count_24h,
       last_attempt_at,
       last_claimed_at
     FROM user_campaign_activity
     WHERE campaign_id = ?
     ORDER BY attempt_count_24h DESC
     LIMIT 100`,
    [campaignId]
  );

  // Rotation tracking
  const [rotationInfo] = await db.query(
    `SELECT
       COUNT(*) as total_serves,
       COUNT(DISTINCT user_id) as unique_users_served,
       AVG(serve_count) as avg_serves_per_user,
       MAX(serve_count) as max_serves_per_user
     FROM campaign_rotation_tracking
     WHERE campaign_id = ?`,
    [campaignId]
  );

  return {
    campaign_id: campaignId,
    enforcement_statistics: enforcementStats,
    user_engagement: userEngagement,
    rotation_info: rotationInfo[0],
  };
}

/**
 * Get per-user analytics
 * @param {number} userId - User ID
 * @param {number} limit - Number of campaigns to include
 * @returns {Promise<object>} - User-specific analytics
 */
async function getUserAnalytics(userId, limit = 20) {
  // User's campaign activity
  const [activity] = await db.query(
    `SELECT
       uca.campaign_id,
       c.title as campaign_title,
       c.coins_per_visit,
       uca.attempt_count_24h,
       uca.last_attempt_at,
       uca.last_claimed_at,
       CASE
         WHEN c.coins_per_visit >= 10 THEN 'HIGH'
         WHEN c.coins_per_visit >= 5 THEN 'MEDIUM'
         ELSE 'LOW'
       END as value_tier
     FROM user_campaign_activity uca
     JOIN campaigns c ON uca.campaign_id = c.id
     WHERE uca.user_id = ?
     ORDER BY uca.last_attempt_at DESC
     LIMIT ?`,
    [userId, limit]
  );

  // User's enforcement history
  const [enforcementHistory] = await db.query(
    `SELECT
       outcome,
       value_tier,
       COUNT(*) as count
     FROM campaign_enforcement_logs
     WHERE user_id = ?
     GROUP BY outcome, value_tier`,
    [userId]
  );

  // User's rotation stats
  const [rotationStats] = await db.query(
    `SELECT
       COUNT(DISTINCT campaign_id) as campaigns_viewed,
       SUM(serve_count) as total_serves,
       AVG(serve_count) as avg_serves_per_campaign
     FROM campaign_rotation_tracking
     WHERE user_id = ?`,
    [userId]
  );

  return {
    user_id: userId,
    campaign_activity: activity,
    enforcement_history: enforcementHistory,
    rotation_statistics: rotationStats[0],
  };
}

/**
 * Get system-wide health metrics
 * @returns {Promise<object>} - System health indicators
 */
async function getSystemHealthMetrics() {
  // Total active users with campaign activity in last 24h
  const [activeUsers] = await db.query(
    `SELECT COUNT(DISTINCT user_id) as active_users_24h
     FROM campaign_enforcement_logs
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
  );

  // Active campaigns being attempted
  const [activeCampaigns] = await db.query(
    `SELECT COUNT(DISTINCT campaign_id) as active_campaigns_24h
     FROM campaign_enforcement_logs
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
  );

  // Success rate (ALLOW vs total attempts)
  const [successRate] = await db.query(
    `SELECT
       SUM(CASE WHEN outcome = 'ALLOW' THEN 1 ELSE 0 END) as allowed,
       COUNT(*) as total,
       (SUM(CASE WHEN outcome = 'ALLOW' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as success_rate_pct
     FROM campaign_enforcement_logs
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
  );

  // Current active sessions
  const [activeSessions] = await db.query(
    `SELECT COUNT(*) as active_sessions
     FROM user_campaign_activity
     WHERE active_session_token IS NOT NULL
       AND active_session_started_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)`
  );

  // Average cooldown wait time
  const [avgCooldown] = await db.query(
    `SELECT AVG(retry_after_sec) as avg_cooldown_wait_sec
     FROM campaign_enforcement_logs
     WHERE outcome = 'COOLDOWN_ACTIVE'
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
  );

  return {
    active_users_24h: activeUsers[0].active_users_24h,
    active_campaigns_24h: activeCampaigns[0].active_campaigns_24h,
    success_rate: successRate[0],
    current_active_sessions: activeSessions[0].active_sessions,
    avg_cooldown_wait_sec: avgCooldown[0].avg_cooldown_wait_sec,
  };
}

/**
 * Get campaign exposure balance report
 * Shows how evenly campaigns are being distributed to users
 * @returns {Promise<Array>} - Campaign exposure metrics
 */
async function getCampaignExposureBalance() {
  const [exposureStats] = await db.query(
    `SELECT
       c.id,
       c.public_id,
       c.title,
       c.coins_per_visit,
       CASE
         WHEN c.coins_per_visit >= 10 THEN 'HIGH'
         WHEN c.coins_per_visit >= 5 THEN 'MEDIUM'
         ELSE 'LOW'
       END as value_tier,
       COUNT(DISTINCT crt.user_id) as unique_users_served,
       COALESCE(SUM(crt.serve_count), 0) as total_serves,
       COALESCE(AVG(crt.serve_count), 0) as avg_serves_per_user,
       c.clicks_served,
       c.total_clicks,
       (c.clicks_served / c.total_clicks) * 100 as completion_pct
     FROM campaigns c
     LEFT JOIN campaign_rotation_tracking crt ON c.id = crt.campaign_id
     WHERE c.is_paused = 0 AND c.is_finished = 0
     GROUP BY c.id
     ORDER BY unique_users_served ASC, total_serves ASC`
  );

  return exposureStats;
}

module.exports = {
  getEnforcementStatistics,
  getCampaignAnalytics,
  getUserAnalytics,
  getSystemHealthMetrics,
  getCampaignExposureBalance,
};
