const bcrypt = require('bcrypt');
const db = require('../db');

const BCRYPT_ROUNDS = 10; // Lighter rounds for OTP hashing
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generate a random 6-digit OTP code
 * @returns {string} 6-digit code with leading zeros
 */
function generateOTP() {
  const code = Math.floor(Math.random() * 1000000);
  return code.toString().padStart(6, '0');
}

/**
 * Create and store OTP for user
 * @param {number} userId - User ID
 * @param {string} purpose - Purpose: 'email_verification' or 'password_reset' (default: 'email_verification')
 * @returns {Object} { code, expiresAt } - plaintext code and expiry time
 */
async function createOTP(userId, purpose = 'email_verification') {
  const code = generateOTP();
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Insert new OTP with purpose
  await db.query(
    `INSERT INTO email_otps (user_id, code_hash, expires_at, purpose)
     VALUES (?, ?, ?, ?)`,
    [userId, codeHash, expiresAt, purpose]
  );

  return { code, expiresAt };
}

/**
 * Check if user has an active OTP (unexpired, unconsumed)
 * @param {number} userId - User ID
 * @param {string} purpose - Purpose filter (optional)
 * @returns {Object|null} Active OTP or null
 */
async function getActiveOTP(userId, purpose = null) {
  let query = `SELECT id, code_hash, expires_at, consumed_at, attempts, created_at, purpose
     FROM email_otps
     WHERE user_id = ?
       AND expires_at > NOW()
       AND consumed_at IS NULL`;

  const params = [userId];

  if (purpose) {
    query += ` AND purpose = ?`;
    params.push(purpose);
  }

  query += ` ORDER BY created_at DESC LIMIT 1`;

  const [otps] = await db.query(query, params);

  return otps.length > 0 ? otps[0] : null;
}

/**
 * Check if user can request a new OTP (cooldown check)
 * @param {number} userId - User ID
 * @returns {boolean} True if can resend
 */
async function canResendOTP(userId) {
  const activeOTP = await getActiveOTP(userId);

  if (!activeOTP) return true;

  // Check cooldown (60 seconds since last OTP created)
  const createdAt = new Date(activeOTP.created_at);
  const cooldownExpiry = new Date(createdAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000);

  return Date.now() >= cooldownExpiry.getTime();
}

/**
 * Verify OTP code for user
 * @param {number} userId - User ID
 * @param {string} code - 6-digit code to verify
 * @param {string} purpose - Purpose filter (optional)
 * @param {boolean} consume - Whether to mark OTP as consumed (default: true)
 * @returns {Object} { success: boolean, error?: string }
 */
async function verifyOTP(userId, code, purpose = null, consume = true) {
  const activeOTP = await getActiveOTP(userId, purpose);

  if (!activeOTP) {
    return { success: false, error: 'No active verification code found' };
  }

  // Check if OTP is locked (too many attempts)
  if (activeOTP.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  // Verify code with bcrypt (constant-time comparison)
  const isValid = await bcrypt.compare(code, activeOTP.code_hash);

  if (!isValid) {
    // Increment attempts
    await db.query(
      'UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?',
      [activeOTP.id]
    );

    return { success: false, error: 'Invalid verification code' };
  }

  // Mark as consumed only if consume flag is true
  if (consume) {
    await db.query(
      'UPDATE email_otps SET consumed_at = NOW() WHERE id = ?',
      [activeOTP.id]
    );
  }

  return { success: true };
}

/**
 * Invalidate all active OTPs for user
 * @param {number} userId - User ID
 */
async function invalidateOTPs(userId) {
  await db.query(
    `UPDATE email_otps
     SET consumed_at = NOW()
     WHERE user_id = ?
       AND expires_at > NOW()
       AND consumed_at IS NULL`,
    [userId]
  );
}

module.exports = {
  generateOTP,
  createOTP,
  getActiveOTP,
  canResendOTP,
  verifyOTP,
  invalidateOTPs,
  OTP_EXPIRY_MINUTES,
  RESEND_COOLDOWN_SECONDS,
};
