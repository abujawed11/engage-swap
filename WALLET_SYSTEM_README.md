# EngageSwap Coin Wallet System

## Overview

The EngageSwap Coin Wallet System is a comprehensive, production-ready wallet implementation that provides accurate, auditable, and transparent coin transaction tracking for users.

### Key Features

1. **Balance Overview**: Available, locked, lifetime earned, and lifetime spent
2. **Transaction History**: Tabbed interface with advanced filtering, sorting, and pagination
3. **Transaction Details**: Comprehensive metadata view for auditability
4. **Admin Audit Logs**: Complete administrative action tracking
5. **Fractional Precision**: 3-decimal precision for all coin amounts
6. **Idempotency**: Duplicate prevention via unique reference IDs
7. **Atomicity**: Database transactions ensure data integrity
8. **Auditability**: Complete audit trail for all mutations

## Installation & Setup

### 1. Database Migration

Run the SQL migration to create the wallet tables:

```bash
# From the engage-backend directory
mysql -u your_username -p engage_swap < db/migrations/wallet_system.sql
```

This will create three new tables:
- `wallets` - Per-user balance tracking
- `wallet_transactions` - Immutable transaction history
- `wallet_audit_logs` - Administrative audit trail

The migration will also:
- Automatically create wallets for all existing users
- Migrate existing coin balances to the new wallet system
- Create audit log entries for the migration

### 2. Backend Dependencies

No additional dependencies are required. The wallet system uses the existing:
- `mysql2` for database operations
- `express` for API routes
- `crypto` (Node.js built-in) for reference ID generation

### 3. Frontend Setup

The frontend components are already integrated. No additional setup is required.

## Architecture

### Backend Components

#### 1. Database Tables

**`wallets`**
- Stores per-user balance and aggregate metrics
- Fields: `available`, `locked`, `lifetime_earned`, `lifetime_spent`
- Constraints ensure non-negative balances

**`wallet_transactions`**
- Immutable append-only transaction ledger
- Types: `EARNED`, `SPENT`, `BONUS`, `REFUND`, `ADMIN_CREDIT`, `ADMIN_DEBIT`
- Statuses: `SUCCESS`, `PENDING`, `FAILED`, `REVERSED`
- Unique `reference_id` for idempotency
- JSON `metadata` for contextual information

**`wallet_audit_logs`**
- Administrative action tracking
- Actor types: `SYSTEM`, `ADMIN`
- Actions: `CREATE_TXN`, `REVERSE_TXN`, `ADJUST_BALANCE`, `RECALC_AGGREGATES`, etc.

#### 2. Core Utilities

**`src/utils/wallet.js`**
- `getWalletBalance(userId)` - Retrieve wallet balance
- `createTransaction(params)` - Create a new transaction (with idempotency)
- `getTransactionHistory(params)` - Query transactions with filters
- `getTransactionById(txnId, userId)` - Get transaction details
- `recalculateWalletAggregates(userId)` - Recompute balances from history
- `getAuditLogs(params)` - Query audit logs (admin only)
- `generateReferenceId(prefix, userId, uniqueKey)` - Generate idempotent IDs
- `formatAmount(amount)` - Format to 3 decimals

**`src/utils/quizRewardWallet.js`**
- `issueQuizReward(connection, userId, campaignId, visitToken, rewardAmount, quizMetadata)` - Issue quiz rewards through wallet

**`src/utils/consolationRewards.js`** (Updated)
- Integrated with wallet system for consolation rewards

#### 3. API Routes

**User Routes** (`/wallet/*`)
- `GET /wallet/balance` - Get current user's wallet balance
- `GET /wallet/transactions` - Get transaction history (with filters)
- `GET /wallet/transactions/:id` - Get transaction details

**Admin Routes** (`/admin/wallet/*`)
- `GET /admin/wallet/audit-logs` - Get audit logs with filters
- `POST /admin/wallet/:userId/adjust` - Manually adjust user balance
- `POST /admin/wallet/:userId/recalculate` - Recalculate wallet aggregates
- `GET /admin/wallet/:userId/balance` - Get user's balance (admin view)
- `GET /admin/wallet/:userId/transactions` - Get user's transactions (admin view)

### Frontend Components

#### 1. Pages

**`src/pages/Wallet.jsx`**
- Main wallet page with balance cards
- Integrates transaction history component

**`src/pages/admin/AdminWalletAuditLogs.jsx`**
- Admin-only audit log viewer
- Advanced filtering and pagination

#### 2. Components

**`src/components/wallet/TransactionHistory.jsx`**
- Tabbed transaction list (All, Earnings, Spending, Bonuses, Transfers)
- Advanced filters (search, date range, status, campaign)
- Sorting and pagination
- Click to view transaction details

**`src/components/wallet/TransactionDetailModal.jsx`**
- Comprehensive transaction details
- Quiz breakdown display
- Consolation details
- Admin remarks
- Raw metadata viewer
- Copy reference ID

## Usage Examples

### For Users

1. **View Wallet Balance**
   - Navigate to `/wallet`
   - See available, locked, lifetime earned, and lifetime spent

2. **Browse Transaction History**
   - Use tabs to filter by type (All, Earnings, Spending, etc.)
   - Apply filters for specific searches
   - Click any transaction to see details

3. **View Transaction Details**
   - Click "Details" button on any transaction
   - See complete metadata including quiz results, campaign info, etc.

### For Admins

1. **View Audit Logs**
   - Navigate to admin audit logs page
   - Filter by user, actor type, action, date range
   - Track all wallet mutations

2. **Manually Adjust Balance**
   - Use admin API to credit or debit coins
   - Provide reason for auditability
   - Action is logged in audit trail

3. **Recalculate Wallet**
   - Recompute balances from transaction history
   - Useful for fixing discrepancies
   - Creates audit log entry

## Integration Points

### Quiz Rewards

When a user completes a quiz and claims their reward:

```javascript
// In src/routes/earn.js - /earn/claim endpoint
const quizRewardResult = await issueQuizReward(
  connection,
  userId,
  campaignId,
  token,
  coinsAwarded,
  {
    correct_count: 4,
    total_count: 5,
    passed: true,
    multiplier: 0.8,
    full_reward: 10.000,
  }
);
```

This creates:
1. A `wallet_transactions` record with type `EARNED`
2. Updates the `wallets` table (`available` and `lifetime_earned`)
3. Creates a `wallet_audit_logs` entry

### Consolation Rewards

When a campaign is paused/deleted/exhausted:

```javascript
// In src/utils/consolationRewards.js
const consolation = await issueConsolationReward(
  connection,
  userId,
  campaignId,
  visitToken,
  'CAMPAIGN_PAUSED'
);
```

This creates:
1. A `wallet_transactions` record with type `BONUS` and source `consolation`
2. Updates the wallet balance
3. Creates an audit log entry
4. Also creates a legacy `consolation_rewards` record for backwards compatibility

### Admin Adjustments

Admins can manually adjust balances:

```bash
POST /admin/wallet/:userId/adjust
{
  "amount": 50.500,
  "type": "credit",
  "reason": "Compensation for system downtime"
}
```

This creates:
1. A `wallet_transactions` record with type `ADMIN_CREDIT`
2. Updates the wallet balance
3. Creates an audit log with admin ID and reason

## Transaction Metadata

Each transaction includes contextual metadata in JSON format:

### Quiz Reward Metadata
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

### Consolation Metadata
```json
{
  "reason": "CAMPAIGN_PAUSED",
  "visit_token": "def456..."
}
```

### Admin Adjustment Metadata
```json
{
  "admin_id": 1,
  "admin_username": "admin",
  "reason": "Compensation for system downtime",
  "adjustment_type": "credit"
}
```

## Idempotency

All transactions use unique reference IDs to prevent duplicates:

```javascript
// Quiz rewards
generateReferenceId('quiz_reward', userId, visitToken)
// Example: quiz_reward_123_a1b2c3d4e5f6...

// Consolation
generateReferenceId('consolation', userId, visitToken)
// Example: consolation_123_x7y8z9a0b1c2...

// Admin adjustments
generateReferenceId('admin_adjust', userId, `${adminId}_${timestamp}`)
// Example: admin_adjust_123_1_1678901234567_f8g9h0i1j2k3...
```

If a transaction with the same `reference_id` is attempted again, it returns the original transaction instead of creating a duplicate.

## Audit Trail

Every wallet mutation creates an audit log entry:

- **Actor Type**: `SYSTEM` (automated) or `ADMIN` (manual)
- **Actor ID**: The admin user ID (if applicable)
- **User ID**: The wallet owner
- **Action**: The type of mutation
- **Transaction ID**: Link to the related transaction (if any)
- **Amount**: The amount involved (if applicable)
- **Reason**: Human-readable explanation
- **Timestamp**: When the action occurred

This provides complete traceability from any balance change back to its originating action.

## Data Integrity

### Constraints
- Balances cannot go negative (CHECK constraints)
- All amounts use `DECIMAL(20,3)` for precision
- Transactions are immutable (no UPDATE operations)
- Reference IDs are unique (prevents duplicates)

### Atomicity
- All operations use database transactions
- Balance updates and transaction creation happen atomically
- Rollback on any error

### Recalculation
- Balances can be recalculated from transaction history
- Useful for fixing discrepancies or verifying integrity
- Creates audit log entry for transparency

## API Query Parameters

### Transaction History
```
GET /wallet/transactions?
  limit=50
  &offset=0
  &types=EARNED,BONUS
  &statuses=SUCCESS
  &campaignId=123
  &startDate=2025-01-01
  &endDate=2025-01-31
  &search=quiz
  &sortBy=created_at
  &sortOrder=DESC
```

### Audit Logs
```
GET /admin/wallet/audit-logs?
  userId=123
  &actorType=ADMIN
  &action=CREATE_TXN
  &startDate=2025-01-01
  &endDate=2025-01-31
  &limit=50
  &offset=0
```

## Testing the System

### 1. Run the Migration
```bash
mysql -u root -p engage_swap < db/migrations/wallet_system.sql
```

### 2. Start the Backend
```bash
cd engage-backend
npm run dev
```

### 3. Start the Frontend
```bash
cd engage-frontend
npm run dev
```

### 4. Test User Flow
1. Sign up / Log in
2. Navigate to `/wallet`
3. Complete a quiz to earn coins
4. View the transaction in the wallet history
5. Click "Details" to see transaction metadata

### 5. Test Admin Flow
1. Log in as admin
2. Navigate to admin audit logs page
3. Apply filters to search logs
4. Use admin API to adjust a user's balance (via Postman/curl)

## Migration Notes

### Existing Users
- All existing users receive a wallet automatically
- Current `coins` balance is migrated to `available`
- `lifetime_earned` is set to match initial balance (assumes all were earned)
- Audit logs created for migration

### Legacy Compatibility
- The old `users.coins` field is no longer updated
- The wallet system is the source of truth
- `consolation_rewards` table still populated for analytics

## Future Enhancements (Not Implemented)

The following are noted in the spec but not implemented in this phase:

1. **Locked Funds**: Mechanism to lock/unlock coins
2. **Transfers**: User-to-user coin transfers
3. **Spending Transactions**: Deduct coins when creating campaigns
4. **Fiat Conversion**: Display equivalent fiat value
5. **Deposits/Withdrawals**: External funding
6. **Refund Flow**: Automated refund processing
7. **Reversed Transactions**: Reversal mechanism

## Troubleshooting

### Balance Mismatch
If a user reports incorrect balance:
1. Check `wallets` table for their balance
2. Query their transaction history
3. Run recalculation: `POST /admin/wallet/:userId/recalculate`
4. Compare calculated vs stored balance
5. Check audit logs for unauthorized changes

### Transaction Not Appearing
1. Check if transaction exists with the reference ID
2. Verify transaction status (may be PENDING or FAILED)
3. Check filters in UI (date range, type, status)
4. Verify user is viewing their own transactions

### Duplicate Transactions
- Should not happen due to reference_id uniqueness
- Check if different reference IDs were used
- Review audit logs for the time period

## Support & Maintenance

### Database Backups
- Ensure regular backups of wallet tables
- Transactions are immutable - never delete historical records
- Audit logs should be retained indefinitely

### Monitoring
- Monitor for negative balances (should not happen)
- Alert on failed transactions
- Track audit log for unusual admin activity

### Performance
- Tables are indexed for common queries
- Pagination prevents large result sets
- Consider archiving old audit logs after 1+ years

## Conclusion

The EngageSwap Coin Wallet System provides a robust, auditable, and user-friendly solution for tracking coin transactions. With proper setup and maintenance, it ensures data integrity and transparency for both users and administrators.

For questions or issues, please refer to the source code documentation or contact the development team.
