/**
 * Consolation Rewards Utility
 * Handles platform-funded goodwill rewards for campaign exhaustion
 */

const db = require('../db');
const CONSOLATION_CONFIG = require('./consolationConfig');
const { roundCoins } = require('./validation');
const wallet = require('./wallet');

/**
 * Check if user is eligible for consolation reward
 * @param {Object} connection - Database connection (transaction)
 * @param {number} userId - User ID
 * @param {number} campaignId - Campaign ID
 * @param {string} visitToken - Visit token (for idempotency)
 * @param {string} reason - Reason for consolation
 * @returns {Object} { eligible: boolean, reason?: string }
 */
async function checkConsolationEligibility(connection, userId, campaignId, visitToken, reason) {
  // 1. Check if visit already received consolation (idempotency check)
  const [existingConsolation] = await connection.query(
    'SELECT id FROM consolation_rewards WHERE visit_token = ?',
    [visitToken]
  );

  if (existingConsolation.length > 0) {
    return { eligible: false, reason: 'Already received consolation for this visit' };
  }

  // 2. Check if visit already received normal reward
  const [existingVisit] = await connection.query(
    'SELECT id FROM visits WHERE visit_token = ?',
    [visitToken]
  );

  if (existingVisit.length > 0) {
    return { eligible: false, reason: 'Already received normal reward' };
  }

  // No other limits - consolation is always given to be fair to visitors
  return { eligible: true };
}

/**
 * Issue consolation reward
 * @param {Object} connection - Database connection (transaction)
 * @param {number} userId - User ID
 * @param {number|null} campaignId - Campaign ID (null if campaign was deleted)
 * @param {string} visitToken - Visit token
 * @param {string} reason - Reason for consolation (EXHAUSTED_VISITS_CAP, EXHAUSTED_COINS, CAMPAIGN_PAUSED, CAMPAIGN_DELETED)
 * @returns {Object} { success: boolean, amount: number, newBalance: number }
 */
async function issueConsolationReward(connection, userId, campaignId, visitToken, reason) {
  const amount = roundCoins(CONSOLATION_CONFIG.DEFAULT_AMOUNT);

  // For deleted campaigns, check if campaign still exists, otherwise use NULL
  let finalCampaignId = campaignId;
  if (campaignId && (reason === 'CAMPAIGN_DELETED' || reason === 'CAMPAIGN_PAUSED')) {
    const [campaignCheck] = await connection.query(
      'SELECT id FROM campaigns WHERE id = ? LIMIT 1',
      [campaignId]
    );
    // If campaign doesn't exist, use NULL to avoid FK constraint error
    if (campaignCheck.length === 0) {
      finalCampaignId = null;
    }
  }

  // 1. Create wallet transaction for consolation
  // NOTE: We need to use the connection's beginTransaction and commit externally
  // So we'll manually insert the wallet transaction within the same connection

  // Ensure wallet exists
  const [existingWallet] = await connection.query(
    'SELECT id FROM wallets WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (existingWallet.length === 0) {
    // Create wallet if it doesn't exist
    await connection.query(
      `INSERT INTO wallets (user_id, available, locked, lifetime_earned, lifetime_spent)
       VALUES (?, 0.000, 0.000, 0.000, 0.000)`,
      [userId]
    );

    // Create audit log
    await connection.query(
      `INSERT INTO wallet_audit_logs (actor_type, user_id, action, reason)
       VALUES (?, ?, ?, ?)`,
      [wallet.ACTOR_TYPE.SYSTEM, userId, wallet.AUDIT_ACTION.CREATE_WALLET, 'Auto-created wallet on first transaction']
    );
  }

  // Generate reference ID for idempotency
  const referenceId = wallet.generateReferenceId('consolation', userId, visitToken);

  // Check if transaction already exists
  const [existingTxn] = await connection.query(
    'SELECT id FROM wallet_transactions WHERE reference_id = ? LIMIT 1',
    [referenceId]
  );

  let txnId;
  if (existingTxn.length === 0) {
    // Update wallet balance FIRST
    await connection.query(
      'UPDATE wallets SET available = available + ?, lifetime_earned = lifetime_earned + ? WHERE user_id = ?',
      [wallet.formatAmount(amount), wallet.formatAmount(amount), userId]
    );

    // Get the updated balance
    const [updatedWallet] = await connection.query(
      'SELECT available FROM wallets WHERE user_id = ?',
      [userId]
    );
    const balanceAfter = wallet.formatAmount(updatedWallet[0].available);

    // Create transaction with balance_after
    const [txnResult] = await connection.query(
      `INSERT INTO wallet_transactions
       (user_id, type, status, amount, sign, balance_after, campaign_id, source, reference_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        wallet.TXN_TYPE.BONUS,
        wallet.TXN_STATUS.SUCCESS,
        wallet.formatAmount(amount),
        wallet.TXN_SIGN.PLUS,
        balanceAfter,
        finalCampaignId,
        'consolation',
        referenceId,
        JSON.stringify({ reason, visit_token: visitToken })
      ]
    );
    txnId = txnResult.insertId;

    // Create audit log
    await connection.query(
      `INSERT INTO wallet_audit_logs
       (actor_type, user_id, action, txn_id, amount, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        wallet.ACTOR_TYPE.SYSTEM,
        userId,
        wallet.AUDIT_ACTION.CREATE_TXN,
        txnId,
        wallet.formatAmount(amount),
        `Consolation reward: ${reason}`,
      ]
    );
  } else {
    txnId = existingTxn[0].id;
  }

  // 2. Record consolation reward (for legacy tracking)
  await connection.query(
    `INSERT INTO consolation_rewards (visit_token, campaign_id, user_id, amount, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [visitToken, finalCampaignId, userId, amount, reason]
  );

  // 3. Get updated balance from wallet
  const [wallets] = await connection.query(
    'SELECT available FROM wallets WHERE user_id = ?',
    [userId]
  );

  return {
    success: true,
    amount: amount,
    newBalance: wallets[0].available,
  };
}

/**
 * Record failed visit with no reward (for analytics)
 * @param {Object} connection - Database connection (transaction)
 * @param {number} userId - User ID
 * @param {number} campaignId - Campaign ID
 * @param {number} campaignOwnerId - Campaign owner ID
 * @param {string} visitToken - Visit token
 * @param {string} publicId - Visit public ID
 */
async function recordFailedVisit(connection, userId, campaignId, campaignOwnerId, visitToken, publicId) {
  const today = new Date().toISOString().slice(0, 10);

  await connection.query(
    `INSERT INTO visits (user_id, campaign_id, campaign_owner_id, coins_earned, is_consolation, visit_date, visit_token, public_id)
     VALUES (?, ?, ?, 0.000, 0, ?, ?, ?)`,
    [userId, campaignId, campaignOwnerId, today, visitToken, publicId]
  );
}

module.exports = {
  checkConsolationEligibility,
  issueConsolationReward,
  recordFailedVisit,
  CONSOLATION_CONFIG,
};
