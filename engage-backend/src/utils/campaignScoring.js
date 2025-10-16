const db = require('../db');

/**
 * Campaign Scoring System
 * Implements deterministic score-based ranking for campaign ordering
 */

// Default scoring configuration
const DEFAULT_CONFIG = {
  weights: {
    payout: 1.0,
    progress: 0.5,
    fresh: 0.25,
    recent_penalty: 1.5,
    exposure_penalty: 0.5,
  },
  freshness_cap_sec: 259200, // 72 hours
  rotation_windows: {
    high: 21600,   // 6 hours
    medium: 10800, // 3 hours
    low: 3600,     // 1 hour
  },
  exposure_cap_ratio: 0.40,
  jitter_band: 0.02,
};

/**
 * Load scoring configuration from database
 * Falls back to defaults if not configured
 */
async function loadScoringConfig() {
  try {
    const [rows] = await db.query(
      'SELECT config_key, config_value FROM campaign_limit_config WHERE config_key = ?',
      ['scoring_config']
    );

    if (rows.length > 0) {
      return { ...DEFAULT_CONFIG, ...rows[0].config_value };
    }
  } catch (err) {
    console.warn('[Scoring] Could not load config from DB, using defaults:', err.message);
  }

  return DEFAULT_CONFIG;
}

/**
 * Determine value tier based on coins_per_visit
 */
function getPayoutTier(coinsPerVisit, valueThresholds = { high: 10, medium: 5 }) {
  if (coinsPerVisit >= valueThresholds.high) return 'high';
  if (coinsPerVisit >= valueThresholds.medium) return 'medium';
  return 'low';
}

/**
 * Normalize a value using min-max normalization
 */
function normalize(value, min, max) {
  if (max === min) return 1; // Single value case
  return (value - min) / Math.max(1e-9, max - min);
}

/**
 * Clamp value between 0 and 1
 */
function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate random jitter within band
 */
function getJitter(band = 0.02) {
  return (Math.random() * 2 - 1) * band; // Random in [-band, +band]
}

/**
 * Calculate score for a single campaign
 */
function calculateCampaignScore(campaign, normalizedValues, config, now) {
  const {
    norm_payout,
    norm_progress,
    norm_fresh,
  } = normalizedValues;

  const {
    weights,
    rotation_windows,
    exposure_cap_ratio,
    jitter_band,
  } = config;

  // Determine if served recently
  const tier = getPayoutTier(campaign.coins_per_visit, { high: 10, medium: 5 });
  const rotationWindow = rotation_windows[tier] || 3600;

  let penalty_recent = 0;
  if (campaign.last_served_at) {
    const secondsSinceServed = (now - new Date(campaign.last_served_at)) / 1000;
    if (secondsSinceServed <= rotationWindow) {
      penalty_recent = 1;
    }
  }

  // Exposure cap penalty (optional for v1, set to 0 if not tracking)
  const penalty_exposure_cap = 0; // TODO: Implement when we track impressions

  // Calculate jitter
  const jitter = getJitter(jitter_band);

  // Calculate final score
  const score =
    weights.payout * norm_payout +
    weights.progress * norm_progress +
    weights.fresh * norm_fresh -
    weights.recent_penalty * penalty_recent -
    weights.exposure_penalty * penalty_exposure_cap +
    jitter;

  return {
    score,
    norm_payout,
    norm_progress,
    norm_fresh,
    penalty_recent,
    penalty_exposure_cap,
    jitter,
  };
}

/**
 * Score and rank campaigns for a user
 * @param {Array} campaigns - Eligible campaigns to score
 * @param {number} userId - Current user ID
 * @param {Date} now - Current timestamp
 * @returns {Array} - Scored and sorted campaigns
 */
async function scoreAndRankCampaigns(campaigns, userId, now = new Date()) {
  if (campaigns.length === 0) return [];

  const config = await loadScoringConfig();

  // Extract values for normalization
  const payouts = campaigns.map(c => parseFloat(c.coins_per_visit));
  const min_payout = Math.min(...payouts);
  const max_payout = Math.max(...payouts);

  // Calculate normalized values for each campaign
  const scoredCampaigns = campaigns.map(campaign => {
    // Remaining progress ratio (0 to 1)
    const remaining_clicks = campaign.total_clicks - campaign.clicks_served;
    const remaining_progress_ratio = remaining_clicks / campaign.total_clicks;

    // Freshness age in seconds
    const freshness_age_sec = (now - new Date(campaign.created_at)) / 1000;

    // Normalize payout
    const norm_payout = normalize(parseFloat(campaign.coins_per_visit), min_payout, max_payout);

    // Progress is already 0..1
    const norm_progress = remaining_progress_ratio;

    // Normalize freshness (1 = newest, 0 = oldest beyond cap)
    const norm_fresh = 1 - clamp(freshness_age_sec / config.freshness_cap_sec, 0, 1);

    // Calculate score
    const scoreData = calculateCampaignScore(
      campaign,
      { norm_payout, norm_progress, norm_fresh },
      config,
      now
    );

    return {
      ...campaign,
      ...scoreData,
      remaining_progress_ratio,
      freshness_age_sec,
    };
  });

  // Sort by score DESC, then tie-breakers
  scoredCampaigns.sort((a, b) => {
    // Primary: score DESC
    if (b.score !== a.score) return b.score - a.score;

    // Tie-breaker 1: coins_per_visit DESC
    if (b.coins_per_visit !== a.coins_per_visit) {
      return parseFloat(b.coins_per_visit) - parseFloat(a.coins_per_visit);
    }

    // Tie-breaker 2: created_at DESC (newer first)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Log top 10 for observability
  const top10 = scoredCampaigns.slice(0, 10).map(c => ({
    campaign_id: c.id,
    title: c.title,
    score: c.score.toFixed(4),
    norm_payout: c.norm_payout.toFixed(3),
    norm_progress: c.norm_progress.toFixed(3),
    norm_fresh: c.norm_fresh.toFixed(3),
    penalty_recent: c.penalty_recent,
    jitter: c.jitter.toFixed(4),
  }));

  console.log(`[Scoring] User ${userId} - Top 10 campaigns:`, JSON.stringify(top10, null, 2));

  return scoredCampaigns;
}

/**
 * Update serve tracking when campaign is shown to user
 */
async function updateServeTracking(userId, campaignId) {
  try {
    await db.query(
      `INSERT INTO campaign_rotation_tracking (user_id, campaign_id, last_served_at, serve_count)
       VALUES (?, ?, NOW(), 1)
       ON DUPLICATE KEY UPDATE
         last_served_at = NOW(),
         serve_count = serve_count + 1`,
      [userId, campaignId]
    );
  } catch (err) {
    console.warn('[Scoring] Could not update serve tracking:', err.message);
  }
}

module.exports = {
  loadScoringConfig,
  getPayoutTier,
  scoreAndRankCampaigns,
  updateServeTracking,
  DEFAULT_CONFIG,
};
