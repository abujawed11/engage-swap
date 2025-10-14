const crypto = require('crypto');
const db = require('../db');

const TOKEN_EXPIRY_SECONDS = 600; // 10 minutes (enough time for watch duration + quiz)

/**
 * Generate a secure random token
 * @returns {string} 64-character hex token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a visit verification token
 * @param {number} userId - User who will visit
 * @param {number} campaignId - Campaign to visit
 * @returns {Object} { token, expiresAt }
 */
async function createVisitToken(userId, campaignId) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000);

  await db.query(
    `INSERT INTO visit_tokens (token, user_id, campaign_id, expires_at)
     VALUES (?, ?, ?, ?)`,
    [token, userId, campaignId, expiresAt]
  );

  return { token, expiresAt };
}

/**
 * Verify and consume a visit token
 * @param {string} token - Token to verify
 * @param {number} userId - User attempting to claim
 * @returns {Object} { valid: boolean, campaignId?: number, error?: string }
 */
async function verifyAndConsumeToken(token, userId) {
  // Find token
  const [tokens] = await db.query(
    `SELECT id, user_id, campaign_id, expires_at, consumed_at
     FROM visit_tokens
     WHERE token = ?
     LIMIT 1`,
    [token]
  );

  if (tokens.length === 0) {
    return { valid: false, error: 'Invalid or expired token' };
  }

  const tokenData = tokens[0];

  // Check if already consumed
  if (tokenData.consumed_at) {
    return { valid: false, error: 'Token already used' };
  }

  // Check expiry
  if (new Date(tokenData.expires_at) < new Date()) {
    return { valid: false, error: 'Token expired' };
  }

  // Check user match
  if (tokenData.user_id !== userId) {
    return { valid: false, error: 'Token does not belong to this user' };
  }

  // Mark as consumed
  await db.query(
    'UPDATE visit_tokens SET consumed_at = NOW() WHERE id = ?',
    [tokenData.id]
  );

  return { valid: true, campaignId: tokenData.campaign_id };
}

/**
 * Clean up expired tokens (can be run periodically)
 */
async function cleanupExpiredTokens() {
  const [result] = await db.query(
    'DELETE FROM visit_tokens WHERE expires_at < NOW()'
  );
  return result.affectedRows;
}

module.exports = {
  createVisitToken,
  verifyAndConsumeToken,
  cleanupExpiredTokens,
  TOKEN_EXPIRY_SECONDS,
};
