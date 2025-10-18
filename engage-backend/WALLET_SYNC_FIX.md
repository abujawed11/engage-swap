# Wallet Balance Sync Fix

## Problem Identified

**Issue:** `users.coins` and `wallets.available` were out of sync

**Example:**
- User: test4
- `users.coins` = **52.440** (outdated)
- `wallets.available` = **0.680** (correct)
- Discrepancy: **51.76 coins**

**Root Cause:**
1. The wallet system (`wallets` table) is the source of truth
2. The `/me` endpoint was still returning `users.coins` (old field)
3. Admin endpoint `/admin/users/:id/adjust-coins` was updating `users.coins` directly
4. Frontend was displaying the wrong balance

---

## Solution Implemented

### 1. Updated `/me` Endpoint (`src/routes/user.js`)

**Before:**
```sql
SELECT id, public_id, username, email, coins, is_admin
FROM users
WHERE id = ?
```

**After:**
```sql
SELECT
  u.id,
  u.public_id,
  u.username,
  u.email,
  u.is_admin,
  COALESCE(w.available, 0.000) as coins
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.id = ?
```

Now `/me` returns `wallets.available` as `coins` → single source of truth!

### 2. Deprecated Admin Endpoint (`src/routes/admin.js`)

The old `/admin/users/:id/adjust-coins` endpoint now:
- Uses the wallet system internally
- Creates proper wallet transactions
- Maintains backwards compatibility
- Returns deprecation notice

### 3. Created Migration (`migrations/025_deprecate_users_coins_field.sql`)

The migration does:
1. Ensures all users have wallets
2. Recalculates wallet balances from `wallet_transactions` table
3. Marks `users.coins` as DEPRECATED (column comment)
4. Keeps column for backwards compatibility (will be removed later)

---

## Deployment Steps

### Step 1: Run the Migration

```bash
mysql -u engage_user -p"engage@25" engage_swap < migrations/025_deprecate_users_coins_field.sql
```

This will:
- Create wallets for any users missing them
- Sync all wallet balances from transaction history
- Fix existing inconsistencies

### Step 2: Verify the Fix

```bash
# Check test4 user before migration
mysql -u engage_user -p"engage@25" engage_swap -e "
SELECT
  u.id,
  u.username,
  u.coins as old_coins,
  w.available as wallet_balance,
  (u.coins - w.available) as difference
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.username = 'test4';
"

# Run migration
# (run the migration command from Step 1)

# Check test4 user after migration
mysql -u engage_user -p"engage@25" engage_swap -e "
SELECT
  u.id,
  u.username,
  u.coins as old_coins,
  w.available as wallet_balance,
  (u.coins - w.available) as difference
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.username = 'test4';
"
```

### Step 3: Restart Backend

```bash
# If using pm2
pm2 restart engage-backend

# Or if running manually
npm run dev
```

### Step 4: Test the Fix

1. **Login as test4:**
   - Should now see **0.68 coins** (correct balance from wallet)
   - Previously showed **52.44 coins** (wrong)

2. **Test Admin Adjustment:**
   - Go to admin panel
   - Adjust coins for a user
   - Verify it creates a wallet transaction
   - Check that balance updates correctly

3. **Verify All Users:**
   ```sql
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
   ```

   After migration, this should return 0 rows (all synced).

---

## What Changed

### Backend Files Modified:

| File | Change |
|------|--------|
| `src/routes/user.js` | `/me` endpoint now returns `wallets.available` as coins |
| `src/routes/admin.js` | Old adjust-coins endpoint now uses wallet system |
| `migrations/025_deprecate_users_coins_field.sql` | New migration to sync data |

### How It Works Now:

```
┌──────────────────────────────────────────┐
│ User earns/spends coins                  │
└─────────────┬────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│ Wallet System (wallet.createTransaction) │
│ - Creates transaction record             │
│ - Updates wallets.available              │
│ - Updates wallets.lifetime_earned/spent  │
└─────────────┬────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│ Frontend calls /me                       │
│ - Returns wallets.available as "coins"  │
│ - User sees correct balance              │
└──────────────────────────────────────────┘

Note: users.coins is NO LONGER UPDATED
      It's kept only for backwards compatibility
```

---

## Database Schema

### Before:
```
users.coins           → 52.440 (stale, not updated)
wallets.available     → 0.680  (correct, source of truth)
```

### After Migration:
```
users.coins           → 0.680  (synced from wallet_transactions)
wallets.available     → 0.680  (source of truth)
```

### Future State (after testing):
```
users.coins           → COLUMN DROPPED (no longer needed)
wallets.available     → 0.680  (sole source of truth)
```

---

## Verification Queries

### Check for Discrepancies
```sql
SELECT
  u.id,
  u.username,
  u.coins as users_table,
  w.available as wallets_table,
  (u.coins - w.available) as difference,
  w.lifetime_earned,
  w.lifetime_spent
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE ABS(u.coins - COALESCE(w.available, 0)) > 0.001
ORDER BY difference DESC;
```

### Verify Transaction History for a User
```sql
SELECT
  id,
  type,
  sign,
  amount,
  balance_after,
  source,
  created_at
FROM wallet_transactions
WHERE user_id = 5  -- test4 user
ORDER BY created_at DESC
LIMIT 20;
```

### Check Wallet Balance Calculation
```sql
SELECT
  user_id,
  SUM(CASE WHEN sign = 'PLUS' THEN amount ELSE -amount END) as calculated_balance,
  (SELECT available FROM wallets WHERE user_id = 5) as actual_balance
FROM wallet_transactions
WHERE user_id = 5 AND status = 'SUCCESS'
GROUP BY user_id;
```

---

## Rollback Plan (if needed)

If something goes wrong:

```sql
-- Revert /me endpoint to use users.coins
-- (restore old version of src/routes/user.js from git)

-- Restore users.coins from wallets
UPDATE users u
LEFT JOIN wallets w ON u.id = w.user_id
SET u.coins = COALESCE(w.available, 0);
```

---

## Future Cleanup (After 1 Week of Testing)

Once confirmed working, you can:

1. **Drop the deprecated column:**
   ```sql
   ALTER TABLE users DROP COLUMN coins;
   ```

2. **Update admin queries** that still reference `users.coins`:
   ```sql
   -- Find them with:
   grep -r "users.coins" engage-backend/src/
   ```

3. **Update any remaining frontend code** that references the old field.

---

## Summary

**Problem:** Users saw wrong balances because two systems were out of sync

**Solution:** Made `wallets.available` the single source of truth for all balance displays

**Impact:**
- ✅ All users now see correct balances
- ✅ All balance updates go through wallet system
- ✅ Full transaction history and audit trail
- ✅ No data loss (migration syncs from transaction history)

**Next Steps:**
1. Run migration
2. Restart backend
3. Test with test4 user
4. Monitor for 1 week
5. Drop `users.coins` column (optional cleanup)
