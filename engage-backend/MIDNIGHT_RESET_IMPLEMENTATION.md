# Midnight Reset Daily Limit Implementation Guide

## Overview

This document describes the implementation of a **midnight-reset daily counter system** that replaces the rolling 24-hour window for campaign visit limits.

### Problem Solved

Previously, the system used a **rolling 24-hour window** to track campaign visit limits:
- User visits a campaign twice at 5:00 PM on Day 1
- User tries again at 10:00 AM on Day 2
- System still sees visits within "past 24 hours" → limit reached ❌

**New behavior with midnight reset (IST timezone):**
- User visits a campaign twice at 5:00 PM on Day 1
- Limit resets at 12:00 AM IST (midnight)
- User can visit again at 10:00 AM on Day 2 ✅

---

## Architecture Changes

### 1. New Database Table: `user_campaign_daily_caps`

**Location:** `migrations/024_add_user_campaign_daily_caps.sql`

```sql
CREATE TABLE `user_campaign_daily_caps` (
  `user_id` BIGINT NOT NULL,
  `campaign_id` BIGINT NOT NULL,
  `date_key` DATE NOT NULL COMMENT 'Local date in Asia/Kolkata (IST)',
  `attempts` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_id`, `campaign_id`, `date_key`)
);
```

**Key Features:**
- `date_key` stores the calendar date in IST timezone (YYYY-MM-DD format)
- Composite primary key ensures one row per user × campaign × day
- Automatic reset: old date_keys become irrelevant after midnight

### 2. New Timezone Utility Module

**Location:** `src/utils/timezone.js`

**Key Functions:**
- `getCurrentDateIST()` - Returns current date in IST as YYYY-MM-DD
- `getSecondsUntilMidnightIST()` - Calculates seconds until next midnight IST
- `getTimeUntilMidnightISTFormatted()` - Human-readable reset time (e.g., "5 hours 23 minutes")

**Why IST?**
- Primary user base is in India
- No DST (Daylight Saving Time) complications
- Consistent midnight reset time: 12:00 AM IST = 6:30 PM UTC (previous day)

### 3. Updated Campaign Limits Logic

**Location:** `src/utils/campaignLimits.js`

**Modified Functions:**

#### `checkCampaignClaimEligibility()`
- **Before:** Counted visits in past 24 hours from now
- **After:** Looks up attempts for current date_key (today in IST)
- **Benefit:** Automatic reset at midnight, no manual cleanup needed

#### `recordSuccessfulClaim()`
- **Before:** Incremented rolling counter with timestamp check
- **After:** Atomic INSERT ... ON DUPLICATE KEY UPDATE with date_key
- **Benefit:** Thread-safe, handles concurrent requests correctly

#### `getEligibleCampaignsWithRotation()`
- **Before:** Showed "X hours until reset" based on last claim timestamp
- **After:** Shows "Resets at 12:00 AM IST (in X hours Y minutes)"
- **Benefit:** Clear, consistent messaging for users

---

## Implementation Details

### Atomic Counter Increment

```sql
INSERT INTO user_campaign_daily_caps (user_id, campaign_id, date_key, attempts)
VALUES (?, ?, ?, 1)
ON DUPLICATE KEY UPDATE
  attempts = CASE
    WHEN attempts < ? THEN attempts + 1
    ELSE attempts
  END
```

**Why this pattern?**
- Prevents race conditions when multiple requests arrive simultaneously
- Caps attempts at the daily limit (won't increment beyond max)
- Works within database transactions for consistency

### Timezone Handling

```javascript
// Get current date in IST (Asia/Kolkata)
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});
const dateKey = formatter.format(new Date()); // "2025-10-18"
```

**Benefits:**
- Uses browser-native `Intl.DateTimeFormat` API
- Handles timezone conversion automatically
- Returns ISO 8601 date format (YYYY-MM-DD)

---

## User-Facing Changes

### Error Messages

**Before:**
> "You've reached your daily limit for this campaign (2 successful attempts). Try again tomorrow."

**After:**
> "Daily limit reached (2/2 attempts). Resets at 12:00 AM IST (in 5 hours 23 minutes)."

### Campaign Queue UI

Campaigns now show clear status messages:

| Status | Message | Retry Info |
|--------|---------|------------|
| `AVAILABLE` | null | null |
| `LIMIT_REACHED` | "Daily limit reached (2/2)" | "Resets at 12:00 AM IST (in 5 hours 23 minutes)" |
| `COOLDOWN` | "Cooldown active" | "Available in 30 minutes" |

### Frontend UI Enhancements

**Campaign Cards (Earn Page):**
- Red-bordered alert box for `LIMIT_REACHED` status
- 🚫 emoji icon for visual clarity
- Prominent display: "⏰ Resets at 12:00 AM IST (in X hours Y minutes)"
- Additional tip: "💡 Limits reset automatically at midnight (12:00 AM IST)"

**Error Display (Gateway Page):**
- Enhanced error messages with ⚠️ icon for limit errors
- Clear indication when daily limit is reached during claim

**Files Modified:**
- `engage-frontend/src/pages/Earn.jsx` - Enhanced status display
- `engage-frontend/src/pages/Gateway.jsx` - Better error handling
- `engage-frontend/src/lib/timezone.js` - New utility for time formatting

---

## Deployment Steps

### 1. Run Database Migration

```bash
# Connect to MySQL
mysql -u your_user -p engage_swap

# Run migration
source migrations/024_add_user_campaign_daily_caps.sql;

# Verify table creation
DESCRIBE user_campaign_daily_caps;
```

### 2. Restart Backend Server

```bash
# Stop server
pm2 stop engage-backend  # or your process manager

# Start server
pm2 start engage-backend

# Check logs
pm2 logs engage-backend
```

### 3. Verify Implementation

**Test Scenario 1: Normal Visit Flow**
1. User visits a campaign (attempt 1)
2. User visits same campaign again (attempt 2)
3. Check database: `SELECT * FROM user_campaign_daily_caps WHERE user_id=X AND campaign_id=Y;`
4. Verify `attempts = 2` and `date_key = current IST date`

**Test Scenario 2: Midnight Reset**
1. User reaches daily limit before midnight
2. Wait for midnight IST (or change system time for testing)
3. User tries campaign again
4. Should be allowed (new date_key, attempts starts at 0)

**Test Scenario 3: Concurrent Requests**
1. Simulate multiple simultaneous claim requests
2. Verify that `attempts` increments correctly without race conditions
3. Check that no request exceeds the daily limit

---

## Edge Cases Handled

### 1. Midnight Boundary (11:59 PM → 12:00 AM IST)

**Scenario:**
- User visits at 11:59 PM IST (date_key: "2025-10-17", attempts: 2)
- User visits at 12:01 AM IST (date_key: "2025-10-18", attempts: 1)

**Result:** ✅ Allowed - different date_keys, automatic reset

### 2. Year/Month Boundaries

**Scenario:**
- User visits on Dec 31, 2025 at 11:59 PM IST (date_key: "2025-12-31")
- User visits on Jan 1, 2026 at 12:01 AM IST (date_key: "2026-01-01")

**Result:** ✅ Handled correctly by date comparison

### 3. Concurrent Claim Requests

**Scenario:**
- User has 1 attempt, limit is 2
- Two claim requests arrive simultaneously

**Result:** ✅ Atomic increment ensures only one succeeds

### 4. Tier Limit Changes Mid-Day

**Scenario:**
- User has 2 attempts (High tier limit: 2)
- Admin changes campaign tier to Medium (limit: 3)

**Result:** ✅ Uses current tier value at validation time

---

## Rollback Plan

If issues occur, you can temporarily disable the new logic:

### Option 1: Keep Both Systems

The old `user_campaign_activity.attempt_count_24h` field is still updated for compatibility. To revert:

1. Modify `checkCampaignClaimEligibility()` to use old logic
2. Comment out new `user_campaign_daily_caps` queries
3. Restart server

### Option 2: Database Rollback

```sql
-- Drop new table (data loss!)
DROP TABLE IF EXISTS user_campaign_daily_caps;

-- Restore old code from git
git checkout HEAD^ -- src/utils/campaignLimits.js
git checkout HEAD^ -- src/utils/timezone.js
```

---

## Performance Considerations

### Index Optimization

The primary key `(user_id, campaign_id, date_key)` is already indexed for fast lookups.

**Query Performance:**
```sql
-- Very fast (uses primary key)
SELECT attempts FROM user_campaign_daily_caps
WHERE user_id=? AND campaign_id=? AND date_key=?;

-- O(1) lookup time
```

### Storage Growth

**Rows per day:** ~1 row per user × campaign interaction

**Cleanup (optional):**
```sql
-- Delete records older than 30 days (run monthly)
DELETE FROM user_campaign_daily_caps
WHERE date_key < DATE_SUB(CURDATE(), INTERVAL 30 DAY);
```

**Storage estimate:**
- 1000 active users × 10 campaigns/day = 10,000 rows/day
- Row size ~40 bytes → ~400 KB/day → ~12 MB/month

---

## Testing

### Unit Tests

**Location:** `tests/timezone.test.js`

**Run tests:**
```bash
# Install Jest (if not already installed)
npm install --save-dev jest

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

**Test coverage:**
- ✅ Date conversion (UTC → IST)
- ✅ Midnight boundary detection
- ✅ Reset timer calculations
- ✅ Edge cases (year/month boundaries)
- ✅ Integration scenarios

### Manual Testing Checklist

- [ ] User can visit campaign up to daily limit
- [ ] User gets clear error when limit reached
- [ ] Error message shows correct time until reset
- [ ] Limit resets at midnight IST
- [ ] Cooldown still works for high-value campaigns
- [ ] Concurrent requests handled correctly
- [ ] Campaign queue shows correct availability status

---

## Monitoring

### Key Metrics to Track

1. **Daily Limit Enforcement Rate**
   ```sql
   SELECT outcome, COUNT(*) as count
   FROM campaign_enforcement_logs
   WHERE DATE(created_at) = CURDATE()
   GROUP BY outcome;
   ```

2. **Average Attempts per User per Day**
   ```sql
   SELECT AVG(attempts) as avg_attempts, MAX(attempts) as max_attempts
   FROM user_campaign_daily_caps
   WHERE date_key = CURDATE();
   ```

3. **Reset Time Accuracy**
   - Monitor user complaints about "limit not resetting"
   - Check server timezone configuration: `SELECT NOW(), UTC_TIMESTAMP();`

---

## FAQ

### Q: Why IST timezone instead of UTC?
**A:** Primary user base is in India. IST has no DST complications, making midnight reset predictable.

### Q: What if user is in a different timezone?
**A:** The system uses IST universally. Users in other timezones will see reset at their local equivalent of 12:00 AM IST (e.g., 6:30 PM UTC previous day).

### Q: Can we customize reset time (e.g., 6:00 AM instead of midnight)?
**A:** Yes, modify `timezone.js` to calculate next reset based on desired hour. Current implementation is optimized for midnight (00:00).

### Q: How does this affect existing users with active counters?
**A:** Old counters in `user_campaign_activity` are ignored. New system starts fresh from deployment date. Users may get one "bonus" day if their old counter was active.

### Q: What happens during database maintenance/downtime?
**A:** If database is unavailable during midnight transition, limits will reset correctly once system comes back online (date_key comparison handles this automatically).

---

## Summary

### What Changed
- ✅ New table: `user_campaign_daily_caps` with calendar-day-based tracking
- ✅ New module: `timezone.js` for IST date calculations
- ✅ Updated: `campaignLimits.js` to use midnight-reset logic
- ✅ Improved: Error messages show exact reset time
- ✅ Added: Comprehensive unit tests for edge cases

### Benefits
- ✅ Clear, predictable limit reset at midnight IST
- ✅ No rolling window confusion
- ✅ Atomic increment (thread-safe)
- ✅ Better user experience with clear messaging
- ✅ Minimal storage overhead
- ✅ Easy to monitor and debug

### Next Steps
1. Deploy migration to production database
2. Monitor enforcement logs for first 24 hours
3. Gather user feedback on new messaging
4. Optional: Add admin dashboard for viewing daily caps
5. Optional: Implement automatic cleanup job for old records

---

**Implementation Date:** 2025-10-18
**Version:** 1.0
**Status:** Production-ready
