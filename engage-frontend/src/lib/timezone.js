/**
 * Timezone Utilities for Frontend
 * Handles IST (India Standard Time) display and formatting
 */

/**
 * Get current time in IST timezone
 * @returns {Date} Current date/time
 */
export function getCurrentTimeIST() {
  return new Date();
}

/**
 * Format seconds into human-readable time
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted string like "5 hours 23 minutes"
 */
export function formatSecondsToTime(seconds) {
  if (seconds <= 0) return '0 minutes';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Format retry_after_seconds from API into display text
 * @param {number} retryAfterSeconds - Seconds from API
 * @returns {string} Display text
 */
export function formatRetryTime(retryAfterSeconds) {
  if (!retryAfterSeconds || retryAfterSeconds <= 0) {
    return 'Available now';
  }

  // Less than 2 minutes - show seconds
  if (retryAfterSeconds < 120) {
    return `Available in ${retryAfterSeconds} second${retryAfterSeconds !== 1 ? 's' : ''}`;
  }

  // Otherwise show hours/minutes
  return `Available in ${formatSecondsToTime(retryAfterSeconds)}`;
}

/**
 * Get IST midnight time string for display
 * @returns {string} "12:00 AM IST"
 */
export function getMidnightISTDisplay() {
  return '12:00 AM IST';
}

/**
 * Check if a timestamp is today in IST
 * @param {string|Date} timestamp
 * @returns {boolean}
 */
export function isToday(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();

  // Simple check - assumes user is in similar timezone
  // For accurate IST check, backend handles the logic
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Parse limit reached message and extract reset info
 * @param {string} message - Error message from backend
 * @returns {object} { hasLimit: boolean, resetTime: string|null }
 */
export function parseLimitMessage(message) {
  if (!message) return { hasLimit: false, resetTime: null };

  // Check if message contains IST reset info
  const istMatch = message.match(/Resets at (.*?)(?:\(|$)/i);
  const hasLimit = message.toLowerCase().includes('limit') ||
                   message.toLowerCase().includes('reached');

  return {
    hasLimit,
    resetTime: istMatch ? istMatch[1].trim() : null,
  };
}

export default {
  getCurrentTimeIST,
  formatSecondsToTime,
  formatRetryTime,
  getMidnightISTDisplay,
  isToday,
  parseLimitMessage,
};
