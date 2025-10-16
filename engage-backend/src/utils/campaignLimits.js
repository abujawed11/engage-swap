const db = require('../db');

/**
 * Campaign Limit Enforcement Utilities
 * Handles dynamic per-user attempt limits, cooldowns, and fair rotation
 */

// Cache for config values (refresh every 5 minutes)
let configCache = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load configuration from database
 */
async function loadConfig() {
  const now = Date.now();
  if (configCache && (now - configCacheTime) < CONFIG_CACHE_TTL) {
    return configCache;
  }

  const [rows] = await db.query(
    'SELECT config_key, config_value FROM campaign_limit_config'
  );

  const config = {};
  for (const row of rows) {
    config[row.config_key] = row.config_value;
  }

  configCache = config;
  configCacheTime = now;
  return config;
}

/**
 * Determine value tier based on coins_per_visit
 * @param {number} coinsPerVisit
 * @returns {'HIGH'|'MEDIUM'|'LOW'}
 */
function getValueTier(coinsPerVisit) {
  // Default thresholds if config not loaded
  const highThreshold = 10;
  const mediumThreshold = 5;

  if (coinsPerVisit >= highThreshold) {
    return 'HIGH';
  } else if (coinsPerVisit >= mediumThreshold) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Get dynamic value tier with config
 * @param {number} coinsPerVisit
 * @param {object} config
 * @returns {'HIGH'|'MEDIUM'|'LOW'}
 */
function getValueTierWithConfig(coinsPerVisit, config) {
  const thresholds = config.value_thresholds || { high: 10, medium: 5 };

  if (coinsPerVisit >= thresholds.high) {
    return 'HIGH';
  } else if (coinsPerVisit >= thresholds.medium) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Get attempt limit for a given tier
 * @param {'HIGH'|'MEDIUM'|'LOW'} tier
 * @param {object} config
 * @returns {number}
 */
function getAttemptLimit(tier, config) {
  const limits = config.attempt_limits || { high: 2, medium: 3, low: 5 };
  return limits[tier.toLowerCase()] || 5;
}

/**
 * Get cooldown duration in seconds
 * @param {object} config
 * @returns {number}
 */
function getCooldownSeconds(config) {
  return config.cooldown_seconds?.value || 3600; // Default: 1 hour
}

/**
 * Get rotation window for a given tier
 * @param {'HIGH'|'MEDIUM'|'LOW'} tier
 * @param {object} config
 * @returns {number}
 */
function getRotationWindow(tier, config) {
  const windows = config.rotation_windows || { high: 21600, medium: 10800, low: 3600 };
  return windows[tier.toLowerCase()] || 3600;
}

/**
 * Get active session timeout
 * @param {object} config
 * @returns {number}
 */
function getActiveSessionTimeout(config) {
  return config.active_session_timeout?.value || 600; // Default: 10 minutes
}

/**
 * Check if user can CLAIM reward for a campaign (enforce all limits at claim time)
 * Attempts are counted ONLY when user successfully claims reward
 * @param {object} connection - Database connection (for transaction)
 * @param {number} userId
 * @param {number} campaignId
 * @param {number} coinsPerVisit
 * @returns {Promise<{allowed: boolean, outcome: string, message: string, retry_after_sec?: number, tier: string}>}
 */
async function checkCampaignClaimEligibility(connection, userId, campaignId, coinsPerVisit) {
  const config = await loadConfig();
  const tier = getValueTierWithConfig(coinsPerVisit, config);
  const attemptLimit = getAttemptLimit(tier, config);
  const cooldownSeconds = getCooldownSeconds(config);

  // Get or create user campaign activity record
  const [activities] = await connection.query(
    `SELECT id, attempt_count_24h, last_claimed_at
     FROM user_campaign_activity
     WHERE user_id = ? AND campaign_id = ?
     FOR UPDATE`,
    [userId, campaignId]
  );

  let activity = activities[0];
  const now = new Date();

  // If no activity exists, create a placeholder for tracking
  if (!activity) {
    const [result] = await connection.query(
      `INSERT INTO user_campaign_activity (user_id, campaign_id, attempt_count_24h, last_claimed_at)
       VALUES (?, ?, 0, NULL)`,
      [userId, campaignId]
    );

    // Fetch the newly created record
    const [newActivities] = await connection.query(
      `SELECT id, attempt_count_24h, last_claimed_at
       FROM user_campaign_activity
       WHERE id = ?
       FOR UPDATE`,
      [result.insertId]
    );
    activity = newActivities[0];
  }

  // Reset attempt count if 24 hours have passed since last CLAIMED reward
  let currentAttemptCount = activity.attempt_count_24h;
  if (activity.last_claimed_at) {
    const hoursSinceLastClaim = (now - new Date(activity.last_claimed_at)) / (1000 * 60 * 60);
    if (hoursSinceLastClaim >= 24) {
      currentAttemptCount = 0;
      // Reset the count in database
      await connection.query(
        'UPDATE user_campaign_activity SET attempt_count_24h = 0 WHERE id = ?',
        [activity.id]
      );
    }
  }

  // Check daily limit
  if (currentAttemptCount >= attemptLimit) {
    // Log enforcement
    await logEnforcement(connection, userId, campaignId, coinsPerVisit, tier, 'LIMIT_REACHED', currentAttemptCount, null, null);

    return {
      allowed: false,
      outcome: 'LIMIT_REACHED',
      message: `You've reached your daily limit for this campaign (${attemptLimit} successful attempts). Try again tomorrow.`,
      tier,
    };
  }

  // Check cooldown - ONLY for campaigns with coins_per_visit >= 10
  if (coinsPerVisit >= 10 && activity.last_claimed_at) {
    const secondsSinceLastClaim = (now - new Date(activity.last_claimed_at)) / 1000;

    if (secondsSinceLastClaim < cooldownSeconds) {
      const retryAfterSec = Math.ceil(cooldownSeconds - secondsSinceLastClaim);

      // Log enforcement
      await logEnforcement(connection, userId, campaignId, coinsPerVisit, tier, 'COOLDOWN_ACTIVE', currentAttemptCount, Math.floor(secondsSinceLastClaim), retryAfterSec);

      return {
        allowed: false,
        outcome: 'COOLDOWN_ACTIVE',
        message: 'Please wait before claiming this campaign again.',
        retry_after_sec: retryAfterSec,
        tier,
      };
    }
  }

  // All checks passed - return success (caller will increment counter after successful claim)
  return {
    allowed: true,
    outcome: 'ALLOW',
    message: 'You can claim this reward.',
    tier,
  };
}

/**
 * Record successful claim - increment counter and update timestamp
 * Called AFTER reward has been successfully issued
 */
async function recordSuccessfulClaim(connection, userId, campaignId, coinsPerVisit) {
  const config = await loadConfig();
  const tier = getValueTierWithConfig(coinsPerVisit, config);
  const now = new Date();

  // Increment attempt count and update last claimed timestamp
  await connection.query(
    `INSERT INTO user_campaign_activity (user_id, campaign_id, attempt_count_24h, last_claimed_at)
     VALUES (?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE
       attempt_count_24h = attempt_count_24h + 1,
       last_claimed_at = ?`,
    [userId, campaignId, now, now]
  );

  // Log the successful claim
  const [activity] = await connection.query(
    'SELECT attempt_count_24h, last_claimed_at FROM user_campaign_activity WHERE user_id = ? AND campaign_id = ?',
    [userId, campaignId]
  );

  if (activity.length > 0) {
    await logEnforcement(connection, userId, campaignId, coinsPerVisit, tier, 'ALLOW', activity[0].attempt_count_24h, null, null);
  }
}


/**
 * Log enforcement decision for analytics
 */
async function logEnforcement(connection, userId, campaignId, coinsPerVisit, tier, outcome, attemptCount, secondsSinceLast, retryAfterSec) {
  await connection.query(
    `INSERT INTO campaign_enforcement_logs
     (user_id, campaign_id, coins_per_visit, value_tier, outcome, attempt_count_24h, seconds_since_last_attempt, retry_after_sec)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, campaignId, coinsPerVisit, tier, outcome, attemptCount, secondsSinceLast, retryAfterSec]
  );
}

/**
 * Update rotation tracking when campaign is served to user
 */
async function updateRotationTracking(connection, userId, campaignId) {
  await connection.query(
    `INSERT INTO campaign_rotation_tracking (user_id, campaign_id, last_served_at, serve_count)
     VALUES (?, ?, NOW(), 1)
     ON DUPLICATE KEY UPDATE
       last_served_at = NOW(),
       serve_count = serve_count + 1`,
    [userId, campaignId]
  );
}

/**
 * Get eligible campaigns with fair rotation
 * Filters campaigns based on:
 * - Rotation windows
 * - Daily limits (if user has reached limit, hide campaign)
 * - Cooldown period (if user is in cooldown, hide campaign)
 * @param {number} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getEligibleCampaignsWithRotation(userId, limit = 10) {
  const config = await loadConfig();
  const rotationWindows = config.rotation_windows || { high: 21600, medium: 10800, low: 3600 };
  const valueThresholds = config.value_thresholds || { high: 10, medium: 5 };
  const cooldownSeconds = getCooldownSeconds(config);
  const attemptLimits = config.attempt_limits || { high: 2, medium: 3, low: 5 };

  // Build SQL that filters out campaigns:
  // 1. Served too recently (rotation window)
  // 2. User has reached daily limit
  // 3. User is in cooldown period (for >=10 coin campaigns only)
  const query = `
    SELECT
      c.id, c.public_id, c.title, c.url, c.coins_per_visit, c.watch_duration,
      c.total_clicks, c.clicks_served, c.created_at,
      crt.last_served_at,
      uca.attempt_count_24h,
      uca.last_claimed_at,
      CASE
        WHEN c.coins_per_visit >= ? THEN 'HIGH'
        WHEN c.coins_per_visit >= ? THEN 'MEDIUM'
        ELSE 'LOW'
      END as value_tier,
      CASE
        WHEN c.coins_per_visit >= ? THEN ?
        WHEN c.coins_per_visit >= ? THEN ?
        ELSE ?
      END as rotation_window_seconds,
      CASE
        WHEN c.coins_per_visit >= ? THEN ?
        WHEN c.coins_per_visit >= ? THEN ?
        ELSE ?
      END as daily_limit,
      TIMESTAMPDIFF(SECOND, uca.last_claimed_at, NOW()) as seconds_since_last_claim,
      TIMESTAMPDIFF(HOUR, uca.last_claimed_at, NOW()) as hours_since_last_claim
    FROM campaigns c
    LEFT JOIN campaign_rotation_tracking crt ON c.id = crt.campaign_id AND crt.user_id = ?
    LEFT JOIN user_campaign_activity uca ON c.id = uca.campaign_id AND uca.user_id = ?
    WHERE c.user_id != ?
      AND c.is_paused = 0
      AND c.is_finished = 0
      AND c.clicks_served < c.total_clicks
      -- Rotation window filter
      AND (
        crt.last_served_at IS NULL
        OR TIMESTAMPDIFF(SECOND, crt.last_served_at, NOW()) > (
          CASE
            WHEN c.coins_per_visit >= ? THEN ?
            WHEN c.coins_per_visit >= ? THEN ?
            ELSE ?
          END
        )
      )
      -- Daily limit filter: hide if user reached limit within 24h
      AND (
        uca.attempt_count_24h IS NULL
        OR uca.last_claimed_at IS NULL
        OR TIMESTAMPDIFF(HOUR, uca.last_claimed_at, NOW()) >= 24
        OR uca.attempt_count_24h < (
          CASE
            WHEN c.coins_per_visit >= ? THEN ?
            WHEN c.coins_per_visit >= ? THEN ?
            ELSE ?
          END
        )
      )
      -- Cooldown filter: hide >=10 coin campaigns if claimed within cooldown period
      AND (
        c.coins_per_visit < ?
        OR uca.last_claimed_at IS NULL
        OR TIMESTAMPDIFF(SECOND, uca.last_claimed_at, NOW()) >= ?
      )
    ORDER BY RAND()
    LIMIT ?
  `;

  const [campaigns] = await db.query(query, [
    // For value_tier CASE
    valueThresholds.high,
    valueThresholds.medium,
    // For rotation_window_seconds CASE
    valueThresholds.high, rotationWindows.high,
    valueThresholds.medium, rotationWindows.medium,
    rotationWindows.low,
    // For daily_limit CASE
    valueThresholds.high, attemptLimits.high,
    valueThresholds.medium, attemptLimits.medium,
    attemptLimits.low,
    // For JOIN and WHERE
    userId,
    userId,
    userId,
    // For rotation window filter
    valueThresholds.high, rotationWindows.high,
    valueThresholds.medium, rotationWindows.medium,
    rotationWindows.low,
    // For daily limit filter
    valueThresholds.high, attemptLimits.high,
    valueThresholds.medium, attemptLimits.medium,
    attemptLimits.low,
    // For cooldown filter (only >=10 coins)
    valueThresholds.high,
    cooldownSeconds,
    // LIMIT
    limit
  ]);

  return campaigns;
}

module.exports = {
  loadConfig,
  getValueTier,
  getValueTierWithConfig,
  getAttemptLimit,
  getCooldownSeconds,
  getRotationWindow,
  getActiveSessionTimeout,
  checkCampaignClaimEligibility,
  recordSuccessfulClaim,
  logEnforcement,
  updateRotationTracking,
  getEligibleCampaignsWithRotation,
};
