/**
 * Quiz Reward Wallet Integration
 * Helper to issue quiz rewards through the wallet system
 */

const wallet = require('./wallet');

/**
 * Issue quiz reward through wallet system
 * @param {Object} connection - Database connection (transaction)
 * @param {number} userId - User ID
 * @param {number} campaignId - Campaign ID
 * @param {string} visitToken - Visit token (for idempotency)
 * @param {number} rewardAmount - Amount to award
 * @param {Object} quizMetadata - Quiz metadata (correct_count, total_count, multiplier, etc.)
 * @returns {Promise<Object>} { amount, newBalance }
 */
async function issueQuizReward(connection, userId, campaignId, visitToken, rewardAmount, quizMetadata) {
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
  const referenceId = wallet.generateReferenceId('quiz_reward', userId, visitToken);

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
      [wallet.formatAmount(rewardAmount), wallet.formatAmount(rewardAmount), userId]
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
        wallet.TXN_TYPE.EARNED,
        wallet.TXN_STATUS.SUCCESS,
        wallet.formatAmount(rewardAmount),
        wallet.TXN_SIGN.PLUS,
        balanceAfter,
        campaignId,
        'quiz_reward',
        referenceId,
        JSON.stringify({
          visit_token: visitToken,
          correct_count: quizMetadata.correct_count,
          total_count: quizMetadata.total_count || 5,
          passed: quizMetadata.passed,
          multiplier: quizMetadata.multiplier,
          full_reward: quizMetadata.full_reward,
          actual_reward: rewardAmount,
        })
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
        wallet.formatAmount(rewardAmount),
        `Quiz reward: ${quizMetadata.correct_count}/${quizMetadata.total_count || 5} correct (${quizMetadata.multiplier}x multiplier)`,
      ]
    );
  } else {
    txnId = existingTxn[0].id;
  }

  // Get updated balance from wallet
  const [wallets] = await connection.query(
    'SELECT available FROM wallets WHERE user_id = ?',
    [userId]
  );

  return {
    amount: wallet.formatAmount(rewardAmount),
    newBalance: wallets[0].available,
  };
}

module.exports = {
  issueQuizReward,
};
