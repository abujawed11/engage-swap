# Wallet System - Complete Integration Summary

## All Coin Operations Now Tracked in Wallet Transactions

Every coin movement in the system now creates a corresponding wallet transaction for complete auditability.

### 1. **Campaign Creation** (SPENT)
**File:** `src/routes/campaigns.js` - POST `/campaigns`

**What happens:**
- User creates a campaign and pays upfront
- Coins are deducted from wallet
- Transaction type: `SPENT`
- Source: `campaign_creation`

**Transaction metadata includes:**
```json
{
  "campaign_public_id": "CMP_xxx",
  "campaign_title": "My Campaign",
  "base_coins_per_visit": 5.000,
  "watch_duration": 45,
  "total_clicks": 100,
  "total_cost": 520.000
}
```

**Where to see it:**
- Navigate to `/wallet`
- Check the "Spending" tab
- Transaction shows negative amount with campaign details

---

### 2. **Campaign Deletion/Refund** (REFUND)
**File:** `src/routes/campaigns.js` - DELETE `/campaigns/:id`

**What happens:**
- User deletes a campaign
- Unused coins are refunded based on remaining clicks
- Transaction type: `REFUND`
- Source: `campaign_deletion`

**Transaction metadata includes:**
```json
{
  "campaign_id": 123,
  "total_clicks": 100,
  "clicks_served": 30,
  "remaining_clicks": 70,
  "base_coins_per_visit": 5.000,
  "watch_duration": 45,
  "refund_amount": 364.000
}
```

**Where to see it:**
- Navigate to `/wallet`
- Check the "All" tab or filter by type
- Transaction shows positive amount with refund details

---

### 3. **Quiz Reward** (EARNED)
**File:** `src/routes/earn.js` - POST `/earn/claim`
**Helper:** `src/utils/quizRewardWallet.js`

**What happens:**
- User completes a quiz and claims reward
- Coins are credited to wallet
- Transaction type: `EARNED`
- Source: `quiz_reward`

**Transaction metadata includes:**
```json
{
  "visit_token": "abc123...",
  "correct_count": 4,
  "total_count": 5,
  "passed": true,
  "multiplier": 0.8,
  "full_reward": "10.000",
  "actual_reward": "8.000"
}
```

**Where to see it:**
- Navigate to `/wallet`
- Check the "Earnings" tab
- Transaction shows positive amount with quiz breakdown
- Click "Details" to see quiz results

---

### 4. **Consolation Reward** (BONUS)
**File:** `src/utils/consolationRewards.js`

**What happens:**
- User encounters a paused/deleted/exhausted campaign
- Platform gives goodwill reward (1.0 coin)
- Transaction type: `BONUS`
- Source: `consolation`

**Transaction metadata includes:**
```json
{
  "reason": "CAMPAIGN_PAUSED",
  "visit_token": "def456..."
}
```

**Where to see it:**
- Navigate to `/wallet`
- Check the "Bonuses" tab
- Transaction shows positive amount with consolation reason

---

### 5. **Admin Manual Adjustment** (ADMIN_CREDIT or ADMIN_DEBIT)
**File:** `src/routes/admin.js` - POST `/admin/wallet/:userId/adjust`
**Also handled by:** `src/utils/wallet.js`

**What happens:**
- Admin manually adjusts a user's balance
- Coins are added or deducted
- Transaction type: `ADMIN_CREDIT` (for credit) or `ADMIN_DEBIT` (for debit)
- Source: `admin_adjustment`

**Transaction metadata includes:**
```json
{
  "admin_id": 1,
  "admin_username": "admin",
  "reason": "Compensation for system downtime",
  "adjustment_type": "credit"
}
```

**Where to see it:**
- Navigate to `/wallet`
- Transaction shows in the "All" tab
- Clearly marked with admin username and reason

---

## Balance Synchronization

### Migration from Old System
- All existing `users.coins` balances were migrated to `wallets.available`
- Migration created audit log entries for transparency
- Run the migration SQL: `db/migrations/wallet_system.sql`

### Current State
- **Source of Truth:** `wallets` table (`available`, `locked`, `lifetime_earned`, `lifetime_spent`)
- **Legacy Field:** `users.coins` is **no longer updated** by the new code
- All new operations use the wallet system exclusively

### Balance Checks
- Campaign creation now checks `wallets.available` (not `users.coins`)
- Insufficient funds errors reference wallet balance

---

## Transaction Details View

Every transaction can be clicked to see comprehensive details:

### For Quiz Rewards:
- Correct answers count
- Multiplier applied
- Base reward vs actual reward
- Campaign information

### For Campaign Creation:
- Campaign title and public ID
- Base coins per visit
- Watch duration
- Total clicks
- Total cost breakdown

### For Campaign Refunds:
- Original campaign details
- Clicks served vs total clicks
- Remaining clicks
- Refund calculation breakdown

### For Consolation:
- Reason (paused, deleted, exhausted)
- Visit token for traceability

### For Admin Adjustments:
- Admin who made the change
- Detailed reason
- Adjustment type (credit/debit)

---

## Audit Trail

Every wallet operation creates an audit log entry with:
- **Actor:** SYSTEM (automated) or ADMIN (manual)
- **Action:** CREATE_TXN, REVERSE_TXN, ADJUST_BALANCE, etc.
- **User:** The wallet owner
- **Transaction ID:** Link to the specific transaction
- **Amount:** The amount involved
- **Reason:** Human-readable explanation
- **Timestamp:** When it occurred

**Admin View:**
- Navigate to `/admin/wallet/audit-logs` (admin only)
- Filter by user, action, actor type, date range
- Complete traceability of all wallet mutations

---

## Idempotency

All transactions use unique reference IDs to prevent duplicates:

| Operation | Reference ID Format |
|-----------|-------------------|
| Campaign Creation | `campaign_create_<userId>_<hash>` |
| Campaign Refund | `campaign_refund_<userId>_<hash>` |
| Quiz Reward | `quiz_reward_<userId>_<visitToken>` |
| Consolation | `consolation_<userId>_<visitToken>` |
| Admin Adjustment | `admin_adjust_<userId>_<adminId>_<timestamp>` |

If the same operation is attempted twice (e.g., network retry), the system:
1. Detects the duplicate reference ID
2. Returns the original transaction
3. Does NOT create a duplicate or double-charge

---

## Testing the Integration

### 1. Test Campaign Creation
```bash
# Create a campaign through the UI
# Check wallet → Spending tab
# Should see negative transaction with campaign details
```

### 2. Test Campaign Deletion
```bash
# Delete a campaign with unused clicks
# Check wallet → All tab
# Should see positive refund transaction
```

### 3. Test Quiz Rewards
```bash
# Complete a quiz and claim reward
# Check wallet → Earnings tab
# Click "Details" to see quiz breakdown
```

### 4. Test Consolation
```bash
# Create campaign, pause it
# Try to complete quiz as another user
# Check wallet → Bonuses tab
# Should see 1.0 coin consolation
```

### 5. Test Admin Adjustment
```bash
# As admin, use API to adjust user balance
POST /admin/wallet/:userId/adjust
{
  "amount": 100,
  "type": "credit",
  "reason": "Testing admin adjustment"
}

# Check user's wallet → should see admin credit
# Check admin audit logs → should see the action
```

---

## Database Schema

### Wallet Tables
```sql
-- User wallets
wallets (
  id, user_id, available, locked,
  lifetime_earned, lifetime_spent,
  created_at, updated_at
)

-- Transaction history
wallet_transactions (
  id, user_id, type, status, amount, sign,
  campaign_id, source, reference_id, metadata,
  created_at
)

-- Audit logs
wallet_audit_logs (
  id, actor_type, actor_id, user_id,
  action, txn_id, amount, reason, metadata,
  created_at
)
```

### Indexes
All tables have proper indexes for:
- User lookups
- Transaction filtering
- Date range queries
- Reference ID uniqueness

---

## Migration Status

✅ **Completed:**
- Database schema created
- All existing users migrated
- Campaign creation → wallet transactions
- Campaign deletion → wallet refunds
- Quiz rewards → wallet transactions
- Consolation rewards → wallet transactions
- Admin adjustments → wallet transactions
- Audit logs for all operations
- Frontend wallet UI
- Transaction history with filters
- Transaction detail modal
- Admin audit log viewer

❌ **Not Implemented (Future):**
- Locked funds mechanism
- User-to-user transfers
- External deposits/withdrawals
- Fiat conversion display

---

## Troubleshooting

### Balance doesn't match?
1. Check wallet balance: `SELECT * FROM wallets WHERE user_id = X`
2. Check transactions: `SELECT * FROM wallet_transactions WHERE user_id = X`
3. Use admin recalculate: `POST /admin/wallet/:userId/recalculate`

### Transaction missing?
1. Check filters in UI (date range, type, status)
2. Verify transaction exists: `SELECT * FROM wallet_transactions WHERE reference_id LIKE '%keyword%'`
3. Check transaction status (may be PENDING or FAILED)

### Duplicate transaction?
- Should NOT happen due to reference_id uniqueness
- Check audit logs to trace what happened
- Verify different reference IDs weren't generated

---

## Benefits

1. **Complete Auditability:** Every coin movement is tracked
2. **User Transparency:** Users can see exactly where coins came from/went
3. **Admin Oversight:** Admins can trace any balance change
4. **Fraud Prevention:** Idempotency prevents duplicates
5. **Data Integrity:** Atomic operations ensure consistency
6. **Historical Record:** Immutable transaction history
7. **Debugging:** Easy to trace and fix discrepancies

---

## Support

For issues or questions:
1. Check transaction history in wallet UI
2. Review audit logs (admin)
3. Use recalculation if needed (admin)
4. Refer to `WALLET_SYSTEM_README.md` for detailed docs
