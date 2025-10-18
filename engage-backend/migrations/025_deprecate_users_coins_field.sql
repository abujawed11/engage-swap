-- Migration: Deprecate users.coins field and sync with wallet system
-- Issue: users.coins and wallets.available are out of sync
-- Fix: Make wallets.available the single source of truth

-- IMPORTANT: This migration does NOT drop the users.coins column immediately
-- It remains for backwards compatibility but is no longer used

-- ============================================================================
-- STEP 1: Ensure all users have wallets
-- ============================================================================

-- Create wallets for users who don't have one yet
INSERT INTO wallets (user_id, available, locked, lifetime_earned, lifetime_spent)
SELECT
  u.id,
  0.000,  -- Start with 0, will be synced from transactions
  0.000,
  0.000,
  0.000
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE w.id IS NULL;

-- ============================================================================
-- STEP 2: Sync users.coins from wallets.available (NOT from transactions)
-- ============================================================================

-- IMPORTANT: The wallets table is already the source of truth and is being
-- maintained correctly by the wallet system during runtime. We DO NOT recalculate
-- from transactions because there may be missing historical data or initial balances.
--
-- Instead, we sync users.coins FROM wallets.available (which is already correct)

UPDATE users u
LEFT JOIN wallets w ON u.id = w.user_id
SET u.coins = COALESCE(w.available, 0.000);

-- Note: wallets.lifetime_earned and wallets.lifetime_spent are already being
-- maintained by the wallet system, so we don't need to recalculate them either.

-- ============================================================================
-- STEP 3: Add comment to users.coins column to mark as deprecated
-- ============================================================================

ALTER TABLE users
MODIFY COLUMN coins DECIMAL(20,3) NOT NULL DEFAULT 0.000
COMMENT 'DEPRECATED: Use wallets.available instead. Kept for backwards compatibility only.';

-- ============================================================================
-- STEP 4: Verification Query (run after migration to verify)
-- ============================================================================

-- After migration, check that all users.coins are synced with wallets.available:
SELECT
  u.id,
  u.username,
  u.coins as users_coins,
  COALESCE(w.available, 0) as wallet_available,
  ABS(u.coins - COALESCE(w.available, 0)) as difference
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE ABS(u.coins - COALESCE(w.available, 0)) > 0.001
ORDER BY difference DESC;

-- After successful migration, this should return 0 rows

-- ============================================================================
-- NOTES:
-- ============================================================================

-- After this migration:
-- 1. All API endpoints should use wallets.available as the source of truth
-- 2. The users.coins field will no longer be updated
-- 3. /me endpoint now returns COALESCE(w.available, 0) as coins
-- 4. Frontend will automatically show correct balance

-- To completely remove users.coins field (after confirming everything works):
-- ALTER TABLE users DROP COLUMN coins;
-- (DO NOT run this yet - keep for backwards compatibility for now)
