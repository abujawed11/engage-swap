/**
 * Quiz Reward Calculation
 * Implements partial reward logic based on correct answer count
 */

const { roundCoins } = require('./validation');

// Pass threshold: minimum correct answers required
const PASS_THRESHOLD = 3;

// Reward multipliers based on correct count
const REWARD_MULTIPLIERS = {
  0: 0.00, // FAIL
  1: 0.00, // FAIL
  2: 0.00, // FAIL
  3: 0.60, // 60% reward
  4: 0.80, // 80% reward
  5: 1.00, // 100% reward (full)
};

/**
 * Check if quiz result is a pass
 * @param {number} correctCount - Number of correct answers (0-5)
 * @returns {boolean}
 */
function isQuizPass(correctCount) {
  return correctCount >= PASS_THRESHOLD;
}

/**
 * Get reward multiplier for a given correct count
 * @param {number} correctCount - Number of correct answers (0-5)
 * @returns {number} Multiplier (0.00, 0.60, 0.80, or 1.00)
 */
function getRewardMultiplier(correctCount) {
  if (correctCount < 0 || correctCount > 5) {
    throw new Error('Correct count must be between 0 and 5');
  }
  return REWARD_MULTIPLIERS[correctCount];
}

/**
 * Calculate actual reward based on quiz performance
 * @param {number} fullReward - The maximum reward (base coins_per_visit)
 * @param {number} correctCount - Number of correct answers (0-5)
 * @returns {object} { passed, multiplier, reward }
 */
function calculateQuizReward(fullReward, correctCount) {
  const passed = isQuizPass(correctCount);
  const multiplier = getRewardMultiplier(correctCount);
  const reward = roundCoins(fullReward * multiplier);

  return {
    passed,
    correctCount,
    multiplier,
    reward,
  };
}

/**
 * Get reward preview text for UI
 * @param {number} fullReward - The maximum reward
 * @param {number} correctCount - Number of correct answers
 * @returns {string} Description like "15.6 coins (60%)"
 */
function getRewardPreviewText(fullReward, correctCount) {
  const { multiplier, reward } = calculateQuizReward(fullReward, correctCount);

  if (multiplier === 0) {
    return '0 coins (failed)';
  }

  const percentage = Math.round(multiplier * 100);

  // Format based on value size
  if (reward < 1) {
    return `${reward.toFixed(2)} coins (${percentage}%)`;
  }

  return `${reward.toFixed(1)} coins (${percentage}%)`;
}

/**
 * Get all reward tier previews for display
 * @param {number} fullReward - The maximum reward
 * @returns {array} Array of {correctCount, multiplier, reward, text}
 */
function getRewardTiers(fullReward) {
  const tiers = [];

  for (let i = 3; i <= 5; i++) {
    const { multiplier, reward } = calculateQuizReward(fullReward, i);
    tiers.push({
      correctCount: i,
      multiplier,
      reward,
      text: getRewardPreviewText(fullReward, i),
    });
  }

  return tiers;
}

module.exports = {
  PASS_THRESHOLD,
  REWARD_MULTIPLIERS,
  isQuizPass,
  getRewardMultiplier,
  calculateQuizReward,
  getRewardPreviewText,
  getRewardTiers,
};
