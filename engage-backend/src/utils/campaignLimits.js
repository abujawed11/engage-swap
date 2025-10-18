const db = require('../db');
const { getCurrentDateIST, getSecondsUntilMidnightIST, getTimeUntilMidnightISTFormatted } = require('./timezone');

/**
 * Campaign Limit Enforcement Utilities
 * Handles dynamic per-user attempt limits with midnight-reset daily counter (IST timezone)
 * Limits reset automatically every midnight (00:00 IST) - calendar-day-based, not rolling 24h
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
 * Uses midnight-reset daily counter (IST timezone) instead of rolling 24-hour window
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

  // Get current date in IST timezone (YYYY-MM-DD format)
  const dateKey = getCurrentDateIST();

  // Get today's attempt count from daily caps table
  const [dailyCaps] = await connection.query(
    `SELECT attempts
     FROM user_campaign_daily_caps
     WHERE user_id = ? AND campaign_id = ? AND date_key = ?
     FOR UPDATE`,
    [userId, campaignId, dateKey]
  );

  let currentAttemptCount = 0;
  if (dailyCaps.length > 0) {
    currentAttemptCount = dailyCaps[0].attempts;
  }

  // Check daily limit (resets at midnight IST automatically)
  if (currentAttemptCount >= attemptLimit) {
    // Log enforcement
    await logEnforcement(connection, userId, campaignId, coinsPerVisit, tier, 'LIMIT_REACHED', currentAttemptCount, null, null);

    // Calculate time until reset
    const secondsUntilReset = getSecondsUntilMidnightIST();
    const timeFormatted = getTimeUntilMidnightISTFormatted();

    return {
      allowed: false,
      outcome: 'LIMIT_REACHED',
      message: `Daily limit reached (${currentAttemptCount}/${attemptLimit} attempts). Resets at 12:00 AM IST (in ${timeFormatted}).`,
      retry_after_sec: secondsUntilReset,
      tier,
    };
  }

  // Check cooldown - ONLY for campaigns with coins_per_visit >= 10
  // Use user_campaign_activity to track last claimed timestamp for cooldown
  if (coinsPerVisit >= 10) {
    const [activities] = await connection.query(
      `SELECT last_claimed_at
       FROM user_campaign_activity
       WHERE user_id = ? AND campaign_id = ?
       FOR UPDATE`,
      [userId, campaignId]
    );

    if (activities.length > 0 && activities[0].last_claimed_at) {
      const now = new Date();
      const secondsSinceLastClaim = (now - new Date(activities[0].last_claimed_at)) / 1000;

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
 * Record successful claim - increment daily counter atomically
 * Called AFTER reward has been successfully issued
 * Uses midnight-reset daily caps table with transaction-safe atomic increment
 */
async function recordSuccessfulClaim(connection, userId, campaignId, coinsPerVisit) {
  const config = await loadConfig();
  const tier = getValueTierWithConfig(coinsPerVisit, config);
  const attemptLimit = getAttemptLimit(tier, config);
  const now = new Date();

  // Get current date in IST timezone
  const dateKey = getCurrentDateIST();

  // Atomic increment using INSERT ... ON DUPLICATE KEY UPDATE
  // This ensures thread-safe increment even with concurrent requests
  await connection.query(
    `INSERT INTO user_campaign_daily_caps (user_id, campaign_id, date_key, attempts)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       attempts = CASE
         WHEN attempts < ? THEN attempts + 1
         ELSE attempts
       END`,
    [userId, campaignId, dateKey, attemptLimit]
  );

  // Also update last_claimed_at timestamp in user_campaign_activity for cooldown tracking
  await connection.query(
    `INSERT INTO user_campaign_activity (user_id, campaign_id, attempt_count_24h, last_claimed_at)
     VALUES (?, ?, 0, ?)
     ON DUPLICATE KEY UPDATE
       last_claimed_at = ?`,
    [userId, campaignId, now, now]
  );

  // Get the updated attempt count for logging
  const [dailyCaps] = await connection.query(
    'SELECT attempts FROM user_campaign_daily_caps WHERE user_id = ? AND campaign_id = ? AND date_key = ?',
    [userId, campaignId, dateKey]
  );

  if (dailyCaps.length > 0) {
    await logEnforcement(connection, userId, campaignId, coinsPerVisit, tier, 'ALLOW', dailyCaps[0].attempts, null, null);
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
 * Get campaigns with availability status and scored ranking
 * Shows ALL campaigns but includes status info (available/cooldown/limit_reached)
 * Orders campaigns using score-based ranking system
 * Uses midnight-reset daily counter (IST timezone) for limit checking
 * @param {number} userId
 * @param {number} limit
 * @returns {Promise<Array>} - Campaigns with availability_status field
 */
async function getEligibleCampaignsWithRotation(userId, limit = 10) {
  const config = await loadConfig();
  const valueThresholds = config.value_thresholds || { high: 10, medium: 5 };
  const cooldownSeconds = getCooldownSeconds(config);
  const attemptLimits = config.attempt_limits || { high: 2, medium: 3, low: 5 };

  // Get current date in IST timezone for daily caps lookup
  const dateKey = getCurrentDateIST();

  // Get ALL campaigns with user activity data, serve tracking, AND daily caps
  const query = `
    SELECT
      c.id, c.public_id, c.title, c.url, c.coins_per_visit, c.watch_duration,
      c.total_clicks, c.clicks_served, c.created_at,
      u.username as creator_username,
      uca.last_claimed_at,
      crt.last_served_at,
      crt.serve_count,
      ucd.attempts as daily_attempts,
      CASE
        WHEN c.coins_per_visit >= ? THEN 'HIGH'
        WHEN c.coins_per_visit >= ? THEN 'MEDIUM'
        ELSE 'LOW'
      END as value_tier,
      CASE
        WHEN c.coins_per_visit >= ? THEN ?
        WHEN c.coins_per_visit >= ? THEN ?
        ELSE ?
      END as daily_limit,
      TIMESTAMPDIFF(SECOND, uca.last_claimed_at, NOW()) as seconds_since_last_claim
    FROM campaigns c
    INNER JOIN users u ON c.user_id = u.id
    LEFT JOIN user_campaign_activity uca ON c.id = uca.campaign_id AND uca.user_id = ?
    LEFT JOIN campaign_rotation_tracking crt ON c.id = crt.campaign_id AND crt.user_id = ?
    LEFT JOIN user_campaign_daily_caps ucd ON c.id = ucd.campaign_id AND ucd.user_id = ? AND ucd.date_key = ?
    WHERE c.user_id != ?
      AND c.is_paused = 0
      AND c.is_finished = 0
      AND c.clicks_served < c.total_clicks
  `;

  const [campaigns] = await db.query(query, [
    // For value_tier CASE
    valueThresholds.high,
    valueThresholds.medium,
    // For daily_limit CASE
    valueThresholds.high, attemptLimits.high,
    valueThresholds.medium, attemptLimits.medium,
    attemptLimits.low,
    // For JOINs and WHERE
    userId,
    userId,
    userId,
    dateKey,
    userId
  ]);

  // Calculate seconds until midnight IST for showing reset time
  const secondsUntilMidnight = getSecondsUntilMidnightIST();
  const timeUntilMidnight = getTimeUntilMidnightISTFormatted();

  // Add availability status to each campaign
  const campaignsWithStatus = campaigns.map(campaign => {
    const attemptCount = campaign.daily_attempts || 0;
    const dailyLimit = campaign.daily_limit;
    const secondsSinceClaim = campaign.seconds_since_last_claim;
    const isHighValue = campaign.coins_per_visit >= valueThresholds.high;

    // Check if daily limit reached (resets at midnight IST)
    if (attemptCount >= dailyLimit) {
      return {
        ...campaign,
        available: false,
        availability_status: 'LIMIT_REACHED',
        status_message: `Daily limit reached (${attemptCount}/${dailyLimit})`,
        retry_info: `Resets at 12:00 AM IST (in ${timeUntilMidnight})`,
        retry_after_seconds: secondsUntilMidnight,
      };
    }

    // Check cooldown (only for high-value campaigns)
    if (isHighValue && campaign.last_claimed_at && secondsSinceClaim < cooldownSeconds) {
      const secondsRemaining = Math.ceil(cooldownSeconds - secondsSinceClaim);

      // Format time based on duration
      let retryInfo;
      if (secondsRemaining < 120) {
        // Show seconds if less than 2 minutes
        retryInfo = `Available in ${secondsRemaining} second(s)`;
      } else {
        // Show minutes for longer cooldowns
        const minutesRemaining = Math.ceil(secondsRemaining / 60);
        retryInfo = `Available in ${minutesRemaining} minute(s)`;
      }

      return {
        ...campaign,
        available: false,
        availability_status: 'COOLDOWN',
        status_message: `Cooldown active`,
        retry_info: retryInfo,
        retry_after_seconds: secondsRemaining,
      };
    }

    // Campaign is available
    return {
      ...campaign,
      available: true,
      availability_status: 'AVAILABLE',
      status_message: null,
      retry_info: null,
      retry_after_seconds: null,
    };
  });

  // Apply score-based ranking using the scoring system
  const { scoreAndRankCampaigns } = require('./campaignScoring');
  const rankedCampaigns = await scoreAndRankCampaigns(campaignsWithStatus, userId);

  // Return top N campaigns
  return rankedCampaigns.slice(0, limit);
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
