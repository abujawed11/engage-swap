# Updated Campaign Limits - Requirements

## Key Changes from Original Implementation

### 1. ✅ Attempts Count ONLY on Successful Reward Claim

**Original:** Attempts counted when user starts a campaign
**Updated:** Attempts counted only when user successfully claims reward after passing quiz

**Why:** If user fails the quiz, they can retry immediately without penalty. Only successful completions count toward daily limits.

### 2. ✅ Cooldown ONLY for High-Value Campaigns (≥10 coins)

**Original:** 1-hour cooldown for ALL campaigns
**Updated:** 1-hour cooldown ONLY for campaigns with `coins_per_visit >= 10`

**Campaigns <10 coins:** No cooldown - users can claim multiple times as long as they're within daily limits

### 3. ✅ Simplified Flow

**Start (`/earn/start`):**
- No enforcement checks
- Just validates campaign availability
- Generates token
- User can start any campaign any time

**Claim (`/earn/claim`):**
- ALL enforcement happens here
- Checks daily limits (after successful quiz)
- Checks cooldown (only for ≥10 coin campaigns)
- Only counts attempt if reward is actually issued

---

## Updated Tier System

| Campaign Value | Tier   | Daily Limit | Cooldown Between Claims |
|----------------|--------|-------------|-------------------------|
| ≥10 coins      | HIGH   | 2           | 1 hour                  |
| 5-9.99 coins   | MEDIUM | 3           | None                    |
| <5 coins       | LOW    | 5           | None                    |

---

## User Journey Examples

### Example 1: 10 Coin Campaign (HIGH tier)

**Attempt 1:**
1. Start campaign ✅
2. Watch video ✅
3. Fail quiz (2/5 correct) ❌
4. **Can retry immediately** (no cooldown, no attempt counted)

**Attempt 2:**
1. Start campaign ✅
2. Watch video ✅
3. Pass quiz (4/5 correct) ✅
4. Claim reward ✅ → **Attempt #1 counted**
5. Get 10 coins

**Attempt 3 (30 minutes later):**
1. Start campaign ✅
2. Watch video ✅
3. Pass quiz ✅
4. Try to claim → ❌ **COOLDOWN_ACTIVE** (need to wait 30 more minutes)

**Attempt 4 (1 hour after Attempt 2):**
1. Start campaign ✅
2. Watch video ✅
3. Pass quiz ✅
4. Claim reward ✅ → **Attempt #2 counted** (daily limit reached)

**Attempt 5 (same day):**
1. Start campaign ✅
2. Watch video ✅
3. Pass quiz ✅
4. Try to claim → ❌ **LIMIT_REACHED** (2 successful claims per day for HIGH tier)

---

### Example 2: 7 Coin Campaign (MEDIUM tier)

**Attempt 1:**
1. Start campaign ✅
2. Watch video ✅
3. Pass quiz ✅
4. Claim reward ✅ → **Attempt #1 counted**
5. Get 7 coins

**Attempt 2 (immediately after):**
1. Start campaign ✅
2. Watch video ✅
3. Pass quiz ✅
4. Claim reward ✅ → **Attempt #2 counted** (NO cooldown!)
5. Get 7 coins

**Attempt 3 (immediately after):**
1. Start campaign ✅
2. Watch video ✅
3. Fail quiz ❌
4. **Can retry immediately**

**Attempt 4:**
1. Start campaign ✅
2. Watch video ✅
3. Pass quiz ✅
4. Claim reward ✅ → **Attempt #3 counted** (daily limit reached)

**Attempt 5 (same day):**
1. Start campaign ✅
2. Watch video ✅
3. Pass quiz ✅
4. Try to claim → ❌ **LIMIT_REACHED** (3 successful claims per day for MEDIUM tier)

---

### Example 3: 3 Coin Campaign (LOW tier)

- **Daily limit:** 5 successful claims
- **Cooldown:** None
- **Can claim repeatedly** as long as you pass quiz and haven't hit 5 successful claims

**Flow:**
- Claim 1 ✅ → Get 3 coins
- Claim 2 (immediately) ✅ → Get 3 coins
- Claim 3 (immediately) ✅ → Get 3 coins
- Fail quiz ❌ → Can retry immediately (doesn't count)
- Claim 4 ✅ → Get 3 coins
- Claim 5 ✅ → Get 3 coins
- Claim 6 attempt → ❌ **LIMIT_REACHED** (5 per day)

---

## Database Tracking

### `user_campaign_activity` Table

```sql
CREATE TABLE user_campaign_activity (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  campaign_id BIGINT,
  attempt_count_24h INT DEFAULT 0,     -- Counts successful claims only
  last_claimed_at DATETIME NULL,       -- Timestamp of last successful claim
  created_at DATETIME,
  updated_at DATETIME
);
```

**Key Points:**
- `attempt_count_24h` increments ONLY when reward is claimed
- `last_claimed_at` updates ONLY on successful claim
- Used for both daily limit and cooldown checks

---

## API Behavior

### POST /earn/start
**Before enforcement:** Just returns token
**After enforcement:** Still just returns token (no change to response)

### POST /earn/claim
**New Error Responses:**

#### Daily Limit Reached
```json
{
  "error": {
    "code": "LIMIT_REACHED",
    "message": "You've reached your daily limit for this campaign (2 successful attempts). Try again tomorrow."
  }
}
```

#### Cooldown Active (≥10 coins only)
```json
{
  "error": {
    "code": "COOLDOWN_ACTIVE",
    "message": "Please wait before claiming this campaign again.",
    "retry_after_sec": 2847
  }
}
```

---

## Configuration

All limits are configurable in `campaign_limit_config` table:

```sql
-- Change high-tier limit from 2 to 3
UPDATE campaign_limit_config
SET config_value = JSON_SET(config_value, '$.high', 3)
WHERE config_key = 'attempt_limits';

-- Change cooldown from 1h to 30 minutes
UPDATE campaign_limit_config
SET config_value = JSON_SET(config_value, '$.value', 1800)
WHERE config_key = 'cooldown_seconds';

-- Disable cooldown entirely
UPDATE campaign_limit_config
SET config_value = JSON_SET(config_value, '$.value', 0)
WHERE config_key = 'cooldown_seconds';
```

---

## Implementation Summary

✅ **Removed Active Session Tracking** - Not needed since no enforcement at start
✅ **Simplified `/earn/start`** - No locks, no enforcement
✅ **All Enforcement in `/earn/claim`** - After quiz passes
✅ **Cooldown only for ≥10 coins** - Line 187 in `campaignLimits.js`
✅ **Count only successful claims** - `recordSuccessfulClaim()` called after reward issued
✅ **Failed quiz = Immediate retry** - No penalty for quiz failures

---

## Testing Scenarios

### Test 1: Quiz Failure Doesn't Count
1. Start 10-coin campaign
2. Fail quiz
3. Start again immediately → Should work ✅
4. Pass quiz
5. Claim → Should work ✅ (first successful claim)

### Test 2: Cooldown for High-Value Only
1. Claim 10-coin campaign (pass quiz) → ✅
2. Immediately try to claim same campaign → ❌ COOLDOWN_ACTIVE
3. Claim 7-coin campaign (pass quiz) → ✅
4. Immediately try to claim same 7-coin campaign → ✅ (no cooldown!)

### Test 3: Daily Limits
1. Successfully claim a HIGH (10 coins) campaign 2 times → Both ✅
2. Try 3rd claim same day → ❌ LIMIT_REACHED
3. Next day → ✅ Counter reset

---

## Files Modified

1. `src/utils/campaignLimits.js`
   - Renamed `checkCampaignAttemptEligibility` → `checkCampaignClaimEligibility`
   - Added `recordSuccessfulClaim()`
   - Cooldown check only for `coinsPerVisit >= 10` (line 187)
   - Removed active session tracking

2. `src/routes/earn.js`
   - Simplified `/earn/start` (no enforcement)
   - Added enforcement in `/earn/claim` before reward issuance
   - Call `recordSuccessfulClaim()` after reward issued

3. `engage-frontend/src/pages/Earn.jsx`
   - Removed outcome handling from `handleVisit()` (simplified)

---

**Result:** Clean, user-friendly system where only successful completions count and users aren't penalized for quiz failures!
