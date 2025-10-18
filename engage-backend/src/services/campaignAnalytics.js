/**
 * Campaign Analytics Service
 *
 * Provides aggregated analytics for campaigns with IST timezone support.
 * Computes metrics from raw data or daily aggregation table.
 *
 * Performance target: <1.5s for 31-day range
 */

const db = require('../db');
const { getCurrentDateIST, getISTDateFromUTC, formatDateIST } = require('../utils/timezone');

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_DATE_RANGE_DAYS = 31; // Maximum allowed date range for performance

// ============================================================================
// TIMEZONE UTILITIES (IST-specific for analytics)
// ============================================================================

/**
 * Convert UTC datetime to IST date (YYYY-MM-DD)
 */
function getISTDate(utcDatetime) {
  const date = new Date(utcDatetime);
  const istDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  return istDate; // Returns YYYY-MM-DD
}

/**
 * Get date range array in IST
 */
function getDateRangeIST(fromDateIST, toDateIST) {
  const dates = [];
  const current = new Date(fromDateIST + 'T00:00:00');
  const end = new Date(toDateIST + 'T00:00:00');

  while (current <= end) {
    dates.push(formatDateIST(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Validate date range
 */
function validateDateRange(fromDateIST, toDateIST) {
  const from = new Date(fromDateIST);
  const to = new Date(toDateIST);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.');
  }

  if (from > to) {
    throw new Error('Start date must be before or equal to end date.');
  }

  const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
  if (diffDays > MAX_DATE_RANGE_DAYS) {
    throw new Error(`Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days.`);
  }

  return { fromDate: from, toDate: to, diffDays };
}

// ============================================================================
// ANALYTICS COMPUTATION FUNCTIONS
// ============================================================================

/**
 * Get campaign totals for date range
 *
 * @param {number} campaignId - Campaign ID
 * @param {string} fromDateIST - Start date (YYYY-MM-DD)
 * @param {string} toDateIST - End date (YYYY-MM-DD)
 * @returns {Promise<object>} Aggregated totals
 */
async function getCampaignTotals(campaignId, fromDateIST, toDateIST) {
  validateDateRange(fromDateIST, toDateIST);

  // Try to get from daily aggregation table first
  const [dailyData] = await db.query(
    `SELECT
      SUM(total_visits) as total_visits,
      SUM(completed_visits) as completed_visits,
      SUM(total_watch_time_sec) as total_watch_time_sec,
      SUM(total_quiz_attempts) as total_quiz_attempts,
      SUM(total_correct_answers) as total_correct_answers,
      SUM(total_quiz_questions) as total_quiz_questions,
      SUM(coins_spent) as coins_spent
     FROM campaign_analytics_daily
     WHERE campaign_id = ?
       AND date_ist >= ?
       AND date_ist <= ?`,
    [campaignId, fromDateIST, toDateIST]
  );

  if (dailyData.length > 0 && dailyData[0].total_visits !== null) {
    // Data exists in daily table
    const data = dailyData[0];
    const completedVisits = parseInt(data.completed_visits) || 0;
    const totalVisits = parseInt(data.total_visits) || 0;
    const totalQuizQuestions = parseInt(data.total_quiz_questions) || 0;
    const totalCorrectAnswers = parseInt(data.total_correct_answers) || 0;
    const coinsSpent = parseFloat(data.coins_spent) || 0;

    return {
      total_visits: totalVisits,
      completed_visits: completedVisits,
      completion_rate: totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0,
      avg_watch_time_sec: totalVisits > 0 ? (parseInt(data.total_watch_time_sec) || 0) / totalVisits : 0,
      avg_quiz_accuracy: totalQuizQuestions > 0 ? (totalCorrectAnswers / totalQuizQuestions) * 100 : 0,
      coins_spent: coinsSpent,
      coins_per_completion: completedVisits > 0 ? coinsSpent / completedVisits : 0
    };
  }

  // Fallback: compute from raw tables
  return await computeTotalsFromRaw(campaignId, fromDateIST, toDateIST);
}

/**
 * Compute totals from raw tables (fallback when daily table is empty)
 * Uses quiz_attempts as primary source to count ALL attempts (pass and fail)
 */
async function computeTotalsFromRaw(campaignId, fromDateIST, toDateIST) {
  // Get quiz metrics (includes visit counts and completion status)
  const [quizStats] = await db.query(
    `SELECT
      COUNT(*) as total_visits,
      COUNT(CASE WHEN passed = 1 THEN 1 END) as completed_visits,
      SUM(correct_count) as total_correct,
      SUM(total_count) as total_questions,
      SUM(CASE WHEN passed = 1 THEN reward_amount ELSE 0 END) as coins_spent
     FROM quiz_attempts
     WHERE campaign_id = ?
       AND DATE(CONVERT_TZ(submitted_at, '+00:00', '+05:30')) >= ?
       AND DATE(CONVERT_TZ(submitted_at, '+00:00', '+05:30')) <= ?`,
    [campaignId, fromDateIST, toDateIST]
  );

  const quiz = quizStats[0] || {};

  const totalVisits = parseInt(quiz.total_visits) || 0;
  const completedVisits = parseInt(quiz.completed_visits) || 0;
  const totalCorrect = parseInt(quiz.total_correct) || 0;
  const totalQuestions = parseInt(quiz.total_questions) || 0;
  const coinsSpent = parseFloat(quiz.coins_spent) || 0;

  return {
    total_visits: totalVisits,
    completed_visits: completedVisits,
    completion_rate: totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0,
    avg_watch_time_sec: 0, // Not available in raw data without watch duration tracking
    avg_quiz_accuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
    coins_spent: coinsSpent,
    coins_per_completion: completedVisits > 0 ? coinsSpent / completedVisits : 0
  };
}

/**
 * Get daily time series data for campaign
 *
 * @param {number} campaignId - Campaign ID
 * @param {string} fromDateIST - Start date (YYYY-MM-DD)
 * @param {string} toDateIST - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of daily metrics
 */
async function getCampaignDailySeries(campaignId, fromDateIST, toDateIST) {
  validateDateRange(fromDateIST, toDateIST);

  // Try to get from daily aggregation table first
  const [dailyData] = await db.query(
    `SELECT
      date_ist,
      total_visits,
      completed_visits,
      CASE
        WHEN total_visits > 0 THEN ROUND((completed_visits / total_visits) * 100, 2)
        ELSE 0.00
      END as completion_rate,
      avg_watch_time_sec,
      avg_quiz_accuracy,
      coins_spent,
      avg_coins_per_completion,
      visits_desktop,
      visits_mobile,
      visits_unknown
     FROM campaign_analytics_daily
     WHERE campaign_id = ?
       AND date_ist >= ?
       AND date_ist <= ?
     ORDER BY date_ist ASC`,
    [campaignId, fromDateIST, toDateIST]
  );

  if (dailyData.length > 0) {
    // Fill in missing dates with zeros
    const dateRange = getDateRangeIST(fromDateIST, toDateIST);
    const dataMap = new Map(dailyData.map(row => [row.date_ist, row]));

    return dateRange.map(date => {
      const existing = dataMap.get(date);
      if (existing) {
        return {
          date: date,
          visits: parseInt(existing.total_visits),
          completions: parseInt(existing.completed_visits),
          completion_rate: parseFloat(existing.completion_rate),
          avg_watch_time: parseFloat(existing.avg_watch_time_sec),
          avg_quiz_accuracy: parseFloat(existing.avg_quiz_accuracy),
          coins_spent: parseFloat(existing.coins_spent),
          coins_per_completion: parseFloat(existing.avg_coins_per_completion),
          device_split: {
            desktop: parseInt(existing.visits_desktop),
            mobile: parseInt(existing.visits_mobile),
            unknown: parseInt(existing.visits_unknown)
          }
        };
      } else {
        return {
          date: date,
          visits: 0,
          completions: 0,
          completion_rate: 0,
          avg_watch_time: 0,
          avg_quiz_accuracy: 0,
          coins_spent: 0,
          coins_per_completion: 0,
          device_split: { desktop: 0, mobile: 0, unknown: 0 }
        };
      }
    });
  }

  // Fallback: compute from raw tables
  return await computeDailySeriesFromRaw(campaignId, fromDateIST, toDateIST);
}

/**
 * Compute daily series from raw tables (fallback)
 * Uses quiz_attempts as primary source to count ALL attempts (pass and fail)
 */
async function computeDailySeriesFromRaw(campaignId, fromDateIST, toDateIST) {
  const [dailyData] = await db.query(
    `SELECT
      DATE(CONVERT_TZ(qa.submitted_at, '+00:00', '+05:30')) as date_ist,
      COUNT(*) as total_visits,
      COUNT(CASE WHEN qa.passed = 1 THEN 1 END) as completed_visits,
      SUM(CASE WHEN qa.passed = 1 THEN qa.reward_amount ELSE 0 END) as coins_spent
     FROM quiz_attempts qa
     WHERE qa.campaign_id = ?
       AND DATE(CONVERT_TZ(qa.submitted_at, '+00:00', '+05:30')) >= ?
       AND DATE(CONVERT_TZ(qa.submitted_at, '+00:00', '+05:30')) <= ?
     GROUP BY date_ist
     ORDER BY date_ist ASC`,
    [campaignId, fromDateIST, toDateIST]
  );

  // Fill in missing dates with zeros
  const dateRange = getDateRangeIST(fromDateIST, toDateIST);
  const dataMap = new Map(dailyData.map(row => [row.date_ist, row]));

  return dateRange.map(date => {
    const existing = dataMap.get(date);
    if (existing) {
      const visits = parseInt(existing.total_visits);
      const completions = parseInt(existing.completed_visits);
      const coinsSpent = parseFloat(existing.coins_spent) || 0;

      return {
        date: date,
        visits: visits,
        completions: completions,
        completion_rate: visits > 0 ? (completions / visits) * 100 : 0,
        avg_watch_time: 0,
        avg_quiz_accuracy: 0,
        coins_spent: coinsSpent,
        coins_per_completion: completions > 0 ? coinsSpent / completions : 0,
        device_split: { desktop: 0, mobile: 0, unknown: 0 }
      };
    } else {
      return {
        date: date,
        visits: 0,
        completions: 0,
        completion_rate: 0,
        avg_watch_time: 0,
        avg_quiz_accuracy: 0,
        coins_spent: 0,
        coins_per_completion: 0,
        device_split: { desktop: 0, mobile: 0, unknown: 0 }
      };
    }
  });
}

/**
 * Get device split for campaign
 */
async function getDeviceSplit(campaignId, fromDateIST, toDateIST) {
  validateDateRange(fromDateIST, toDateIST);

  // Try daily table first
  const [dailyData] = await db.query(
    `SELECT
      SUM(visits_desktop) as desktop,
      SUM(visits_mobile) as mobile,
      SUM(visits_unknown) as unknown
     FROM campaign_analytics_daily
     WHERE campaign_id = ?
       AND date_ist >= ?
       AND date_ist <= ?`,
    [campaignId, fromDateIST, toDateIST]
  );

  if (dailyData.length > 0 && dailyData[0].desktop !== null) {
    return {
      desktop: parseInt(dailyData[0].desktop) || 0,
      mobile: parseInt(dailyData[0].mobile) || 0,
      unknown: parseInt(dailyData[0].unknown) || 0
    };
  }

  // Fallback: return zeros (device tracking not implemented in raw data yet)
  return {
    desktop: 0,
    mobile: 0,
    unknown: 0
  };
}

/**
 * Get top countries (optional - requires country tracking)
 */
async function getCountryTopN(campaignId, fromDateIST, toDateIST, n = 5) {
  // Not implemented yet - requires country_code field in visits table
  return [];
}

/**
 * Get campaign basic info
 */
async function getCampaignInfo(campaignId) {
  const [campaigns] = await db.query(
    `SELECT
      id,
      title,
      user_id as owner_id,
      coins_per_visit,
      total_clicks,
      clicks_served,
      (total_clicks - clicks_served) as clicks_remaining,
      created_at,
      is_paused,
      is_finished
     FROM campaigns
     WHERE id = ?`,
    [campaignId]
  );

  if (campaigns.length === 0) {
    throw new Error('Campaign not found');
  }

  return campaigns[0];
}

/**
 * Check if user owns campaign
 */
async function checkCampaignOwnership(campaignId, userId) {
  const [campaigns] = await db.query(
    'SELECT user_id FROM campaigns WHERE id = ?',
    [campaignId]
  );

  if (campaigns.length === 0) {
    return false;
  }

  return campaigns[0].user_id === userId;
}

/**
 * Get aggregated summary analytics for all campaigns owned by a user
 *
 * @param {number} userId - User ID
 * @param {string} fromDateIST - Start date (YYYY-MM-DD)
 * @param {string} toDateIST - End date (YYYY-MM-DD)
 * @returns {Promise<object>} Summary metrics and per-campaign data
 */
async function getUserCampaignsSummary(userId, fromDateIST, toDateIST) {
  validateDateRange(fromDateIST, toDateIST);

  // Get all campaigns for the user
  const [campaigns] = await db.query(
    `SELECT
      id,
      title,
      coins_per_visit,
      total_clicks,
      clicks_served,
      (total_clicks - clicks_served) as clicks_remaining,
      is_paused,
      is_finished,
      created_at
     FROM campaigns
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );

  if (campaigns.length === 0) {
    return {
      summary: {
        total_visits: 0,
        total_completions: 0,
        avg_completion_rate: 0,
        total_coins_spent: 0,
        avg_coins_per_completion: 0
      },
      campaigns: []
    };
  }

  const campaignIds = campaigns.map(c => c.id);

  // Try to get aggregated analytics from daily table first
  const [dailyAnalyticsData] = await db.query(
    `SELECT
      campaign_id,
      SUM(total_visits) as total_visits,
      SUM(completed_visits) as completed_visits,
      SUM(coins_spent) as coins_spent,
      AVG(avg_quiz_accuracy) as avg_quiz_accuracy
     FROM campaign_analytics_daily
     WHERE campaign_id IN (?)
       AND date_ist >= ?
       AND date_ist <= ?
     GROUP BY campaign_id`,
    [campaignIds, fromDateIST, toDateIST]
  );

  // Check if we have data in daily table
  const hasData = dailyAnalyticsData.length > 0 && dailyAnalyticsData[0].total_visits !== null;

  console.log('[CampaignAnalytics] getUserCampaignsSummary:', {
    userId,
    fromDateIST,
    toDateIST,
    campaignIds,
    dailyTableHasData: hasData,
    dailyDataLength: dailyAnalyticsData.length
  });

  let analyticsMap = new Map();

  if (hasData) {
    // Use daily aggregation table data
    console.log('[CampaignAnalytics] Using daily aggregation table');
    dailyAnalyticsData.forEach(row => {
      analyticsMap.set(row.campaign_id, {
        visits: parseInt(row.total_visits) || 0,
        completions: parseInt(row.completed_visits) || 0,
        coins_spent: parseFloat(row.coins_spent) || 0,
        avg_quiz_accuracy: parseFloat(row.avg_quiz_accuracy) || 0
      });
    });
  } else {
    // Fallback: compute from raw tables using quiz_attempts as primary source
    // This ensures ALL attempts (pass and fail) are counted for accurate completion rates
    console.log('[CampaignAnalytics] Falling back to raw tables query (using quiz_attempts)');
    const [rawAnalyticsData] = await db.query(
      `SELECT
        qa.campaign_id,
        COUNT(*) as total_visits,
        COUNT(CASE WHEN qa.passed = 1 THEN 1 END) as completed_visits,
        SUM(CASE WHEN qa.passed = 1 THEN qa.reward_amount ELSE 0 END) as coins_spent,
        AVG(CASE WHEN qa.total_count > 0 THEN (qa.correct_count / qa.total_count) * 100 ELSE 0 END) as avg_quiz_accuracy
       FROM quiz_attempts qa
       WHERE qa.campaign_id IN (?)
         AND DATE(CONVERT_TZ(qa.submitted_at, '+00:00', '+05:30')) >= ?
         AND DATE(CONVERT_TZ(qa.submitted_at, '+00:00', '+05:30')) <= ?
       GROUP BY qa.campaign_id`,
      [campaignIds, fromDateIST, toDateIST]
    );

    console.log('[CampaignAnalytics] Raw analytics query result:', {
      rowCount: rawAnalyticsData.length,
      rows: rawAnalyticsData
    });

    rawAnalyticsData.forEach(row => {
      analyticsMap.set(row.campaign_id, {
        visits: parseInt(row.total_visits) || 0,
        completions: parseInt(row.completed_visits) || 0,
        coins_spent: parseFloat(row.coins_spent) || 0,
        avg_quiz_accuracy: parseFloat(row.avg_quiz_accuracy) || 0
      });
    });
  }

  // Combine campaign info with analytics
  const campaignsWithAnalytics = campaigns.map(campaign => {
    const analytics = analyticsMap.get(campaign.id) || {
      visits: 0,
      completions: 0,
      coins_spent: 0,
      avg_quiz_accuracy: 0
    };

    const completionRate = analytics.visits > 0
      ? (analytics.completions / analytics.visits) * 100
      : 0;

    const coinsPerCompletion = analytics.completions > 0
      ? analytics.coins_spent / analytics.completions
      : 0;

    return {
      id: campaign.id,
      title: campaign.title,
      status: campaign.is_finished ? 'finished' : campaign.is_paused ? 'paused' : 'active',
      coins_per_visit: parseFloat(campaign.coins_per_visit),
      total_clicks: parseInt(campaign.total_clicks),
      clicks_served: parseInt(campaign.clicks_served),
      clicks_remaining: parseInt(campaign.clicks_remaining),
      visits: analytics.visits,
      completions: analytics.completions,
      completion_rate: parseFloat(completionRate.toFixed(2)),
      coins_spent: parseFloat(analytics.coins_spent.toFixed(3)),
      coins_per_completion: parseFloat(coinsPerCompletion.toFixed(3)),
      avg_quiz_accuracy: parseFloat(analytics.avg_quiz_accuracy.toFixed(1)),
      created_at: campaign.created_at
    };
  });

  // Calculate overall summary
  const totalVisits = campaignsWithAnalytics.reduce((sum, c) => sum + c.visits, 0);
  const totalCompletions = campaignsWithAnalytics.reduce((sum, c) => sum + c.completions, 0);
  const totalCoinsSpent = campaignsWithAnalytics.reduce((sum, c) => sum + c.coins_spent, 0);

  const avgCompletionRate = totalVisits > 0
    ? (totalCompletions / totalVisits) * 100
    : 0;

  const avgCoinsPerCompletion = totalCompletions > 0
    ? totalCoinsSpent / totalCompletions
    : 0;

  return {
    summary: {
      total_visits: totalVisits,
      total_completions: totalCompletions,
      avg_completion_rate: parseFloat(avgCompletionRate.toFixed(2)),
      total_coins_spent: parseFloat(totalCoinsSpent.toFixed(3)),
      avg_coins_per_completion: parseFloat(avgCoinsPerCompletion.toFixed(3))
    },
    campaigns: campaignsWithAnalytics
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  getCampaignTotals,
  getCampaignDailySeries,
  getDeviceSplit,
  getCountryTopN,
  getCampaignInfo,
  checkCampaignOwnership,
  validateDateRange,
  getDateRangeIST,
  getUserCampaignsSummary
};
