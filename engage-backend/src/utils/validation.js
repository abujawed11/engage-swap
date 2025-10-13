/**
 * Validation utilities for user input
 */

/**
 * Validate username
 * - 3-32 chars
 * - Alphanumeric + underscore/hyphen only
 * - Must start with a letter
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return 'Username is required';
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return 'Username must be at least 3 characters';
  }

  if (trimmed.length > 32) {
    return 'Username must not exceed 32 characters';
  }

  // Must start with a letter
  if (!/^[a-zA-Z]/.test(trimmed)) {
    return 'Username must start with a letter';
  }

  // Only alphanumeric, underscore, hyphen
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(trimmed)) {
    return 'Username can only contain letters, numbers, underscores, and hyphens';
  }

  return null; // valid
}

/**
 * Validate email with RFC-light regex
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return 'Email is required';
  }

  const trimmed = email.trim();

  if (trimmed.length > 191) {
    return 'Email is too long';
  }

  // RFC-light email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Invalid email format';
  }

  return null; // valid
}

/**
 * Validate password
 * - At least 8 chars
 * - 1 lowercase, 1 uppercase, 1 digit
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  if (password.length > 128) {
    return 'Password is too long';
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  // Check for digit
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }

  return null; // valid
}

/**
 * Sanitize input - trim and limit length
 */
function sanitizeInput(input, maxLength = 255) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

/**
 * Validate URL - only http/https schemes allowed
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return 'URL is required';
  }

  const trimmed = url.trim();

  if (trimmed.length > 512) {
    return 'URL is too long (max 512 characters)';
  }

  try {
    const parsed = new URL(trimmed);

    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'URL must use http or https protocol';
    }

    return null; // valid
  } catch (err) {
    return 'Invalid URL format';
  }
}

/**
 * Validate campaign title
 */
function validateCampaignTitle(title) {
  if (!title || typeof title !== 'string') {
    return 'Title is required';
  }

  const trimmed = title.trim();

  if (trimmed.length < 3) {
    return 'Title must be at least 3 characters';
  }

  if (trimmed.length > 120) {
    return 'Title must not exceed 120 characters';
  }

  return null; // valid
}

/**
 * Validate coins per visit
 */
function validateCoinsPerVisit(coins) {
  const num = Number(coins);

  if (!Number.isInteger(num)) {
    return 'Coins per visit must be a whole number';
  }

  if (num < 1) {
    return 'Coins per visit must be at least 1';
  }

  if (num > 1000) {
    return 'Coins per visit cannot exceed 1000';
  }

  return null; // valid
}

/**
 * Validate total clicks (formerly daily cap)
 */
function validateDailyCap(cap) {
  const num = Number(cap);

  if (!Number.isInteger(num)) {
    return 'Total clicks must be a whole number';
  }

  if (num < 1) {
    return 'Total clicks must be at least 1';
  }

  if (num > 100000) {
    return 'Total clicks cannot exceed 100,000';
  }

  return null; // valid
}

module.exports = {
  validateUsername,
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateUrl,
  validateCampaignTitle,
  validateCoinsPerVisit,
  validateDailyCap,
};
