/**
 * Coin formatting and calculation utilities
 * Handles decimal coin display and watch-duration pricing
 */

/**
 * Format coins for display
 * - Show 1 decimal place by default (e.g., "15.6 coins")
 * - Show 2 decimal places for values < 1 (e.g., "0.60 coins")
 */
export function formatCoins(amount) {
  const num = Number(amount);

  if (isNaN(num)) {
    return '0 coins';
  }

  if (num < 1) {
    // For values less than 1, show 2 decimal places
    return `${num.toFixed(2)} coins`;
  }

  // For values >= 1, show 1 decimal place
  return `${num.toFixed(1)} coins`;
}

/**
 * Format coins without the "coins" suffix
 */
export function formatCoinsValue(amount) {
  const num = Number(amount);

  if (isNaN(num)) {
    return '0';
  }

  if (num < 1) {
    return num.toFixed(2);
  }

  return num.toFixed(1);
}

/**
 * Calculate the number of steps for watch duration pricing
 * Steps = (duration - 30) / 15
 */
export function calculateDurationSteps(duration) {
  return (duration - 30) / 15;
}

/**
 * Calculate the extra cost based on watch duration
 * Extra = 5 × steps, where steps = (duration - 30) / 15
 */
export function calculateDurationExtraCost(duration) {
  const steps = calculateDurationSteps(duration);
  return 5 * steps;
}

/**
 * Calculate total campaign cost including duration-based pricing
 * Total = (baseCoins × totalClicks) + (5 × steps)
 * The extra cost is NOT per visit, it's a flat fee for the entire campaign
 */
export function calculateTotalCampaignCost(baseCoins, watchDuration, totalClicks) {
  const baseCost = baseCoins * totalClicks;
  const extraCost = calculateDurationExtraCost(watchDuration);
  return baseCost + extraCost;
}

/**
 * Allowed watch duration values (in seconds)
 * 30, 45, 60, 75, 90, 105, 120
 */
export const WATCH_DURATION_OPTIONS = [30, 45, 60, 75, 90, 105, 120];

/**
 * Default watch duration (in seconds)
 */
export const DEFAULT_WATCH_DURATION = 30;

/**
 * Validate watch duration
 * - Must be between 30 and 120 seconds (inclusive)
 * - Must be in 15-second increments (30, 45, 60, 75, 90, 105, 120)
 */
export function validateWatchDuration(duration) {
  const num = Number(duration);

  if (!Number.isInteger(num)) {
    return 'Watch duration must be a whole number';
  }

  if (num < 30) {
    return 'Watch duration must be at least 30 seconds';
  }

  if (num > 120) {
    return 'Watch duration cannot exceed 120 seconds';
  }

  // Check if it's in 15-second increments from 30
  if ((num - 30) % 15 !== 0) {
    return 'Watch duration must be in 15-second increments (30, 45, 60, 75, 90, 105, 120)';
  }

  return null; // valid
}

/**
 * Calculate actual coins per visit that visitor should receive
 * This includes the base coins PLUS the per-visit portion of the duration extra cost
 * Formula: baseCoins + (durationExtraCost / totalClicks)
 *
 * Example:
 * - Base: 10 coins, Duration: 60s, Total clicks: 10
 * - Duration extra cost: 5 × 2 = 10 coins (for entire campaign)
 * - Per-visit portion: 10 / 10 = 1 coin per visit
 * - Actual reward: 10 + 1 = 11 coins per visit
 */
export function calculateActualCoinsPerVisit(baseCoins, watchDuration, totalClicks) {
  const baseCoinsNum = Number(baseCoins);
  const watchDurationNum = Number(watchDuration);
  const totalClicksNum = Number(totalClicks);

  const extraCost = calculateDurationExtraCost(watchDurationNum);
  const extraPerVisit = extraCost / totalClicksNum;
  return baseCoinsNum + extraPerVisit;
}

/**
 * Round decimal coins to 1 decimal place for display
 */
export function roundCoins(amount) {
  return Math.round(amount * 10) / 10;
}
