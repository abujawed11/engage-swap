/**
 * Timezone Utilities
 * Handles IST (Asia/Kolkata) timezone conversions for date-based operations
 */

/**
 * Get current date in IST timezone as YYYY-MM-DD string
 * This is used as the date_key for daily limit tracking
 * @returns {string} Date in YYYY-MM-DD format (IST timezone)
 */
function getCurrentDateIST() {
  // Convert current UTC time to IST (UTC+5:30)
  const now = new Date();

  // Create formatter for Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // Returns YYYY-MM-DD format
  return formatter.format(now);
}

/**
 * Get date from a JavaScript Date object in IST timezone as YYYY-MM-DD string
 * @param {Date} date - JavaScript Date object
 * @returns {string} Date in YYYY-MM-DD format (IST timezone)
 */
function getDateISTFromDate(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(date);
}

/**
 * Get next midnight timestamp in IST timezone
 * This is when the daily limits will reset
 * @returns {Date} JavaScript Date object representing next midnight IST
 */
function getNextMidnightIST() {
  const now = new Date();

  // Get current time components in IST
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = istFormatter.formatToParts(now);
  const istTime = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      istTime[part.type] = part.value;
    }
  });

  // Calculate next midnight IST
  // Create a date for tomorrow at 00:00:00 IST
  const nextDay = new Date(now);
  nextDay.setDate(nextDay.getDate() + 1);

  // Get tomorrow's date in IST format
  const tomorrowDateIST = getDateISTFromDate(nextDay);

  // Create a Date object for tomorrow midnight IST
  // We need to convert IST midnight to UTC
  const [year, month, day] = tomorrowDateIST.split('-').map(Number);

  // IST is UTC+5:30, so midnight IST is 18:30 UTC previous day
  const midnightIST = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  // Subtract 5 hours 30 minutes to get UTC time
  midnightIST.setUTCHours(midnightIST.getUTCHours() - 5);
  midnightIST.setUTCMinutes(midnightIST.getUTCMinutes() - 30);

  // If we've already passed today's midnight IST, return tomorrow's midnight
  if (midnightIST <= now) {
    midnightIST.setDate(midnightIST.getDate() + 1);
  }

  return midnightIST;
}

/**
 * Get seconds until next midnight IST
 * Useful for showing "resets in X hours" messages
 * @returns {number} Seconds until next midnight IST
 */
function getSecondsUntilMidnightIST() {
  const now = new Date();
  const nextMidnight = getNextMidnightIST();
  return Math.ceil((nextMidnight - now) / 1000);
}

/**
 * Get human-readable time until next midnight IST
 * @returns {string} Human-readable format like "5 hours 23 minutes"
 */
function getTimeUntilMidnightISTFormatted() {
  const seconds = getSecondsUntilMidnightIST();
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
 * Check if two dates are the same day in IST timezone
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
function isSameDayIST(date1, date2) {
  return getDateISTFromDate(date1) === getDateISTFromDate(date2);
}

/**
 * Format a Date object or date string to YYYY-MM-DD in IST
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Date in YYYY-MM-DD format (IST timezone)
 */
function formatDateIST(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return getDateISTFromDate(d);
}

/**
 * Get IST date from UTC datetime string
 * @param {string} utcDatetime - UTC datetime string
 * @returns {string} Date in YYYY-MM-DD format (IST timezone)
 */
function getISTDateFromUTC(utcDatetime) {
  const date = new Date(utcDatetime);
  return getDateISTFromDate(date);
}

module.exports = {
  getCurrentDateIST,
  getDateISTFromDate,
  getNextMidnightIST,
  getSecondsUntilMidnightIST,
  getTimeUntilMidnightISTFormatted,
  isSameDayIST,
  formatDateIST,
  getISTDateFromUTC,
};
