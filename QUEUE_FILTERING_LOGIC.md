# Queue Filtering Logic - How Campaigns Appear/Disappear

## Overview
Campaigns in the `/earn/queue` are now **intelligently filtered** based on user's activity. A campaign will **hide** from the queue when:
1. User has reached daily limit
2. User is in cooldown period (≥10 coin campaigns only)
3. Campaign was shown too recently (rotation window)

---

## Filtering Rules

### 1. Daily Limit Filter

**Campaign disappears when:**
- User has claimed this campaign X times in last 24 hours (X = tier limit)
- **Reappears when:** 24 hours pass since first claim

**Example:**
```
HIGH tier (≥10 coins): Limit = 2
- Claim #1 at 10:00 AM → Campaign still visible
- Claim #2 at 11:00 AM → Campaign DISAPPEARS ❌
- Next day at 10:01 AM → Campaign REAPPEARS ✅
```

### 2. Cooldown Filter (≥10 coins ONLY)

**Campaign disappears when:**
- `coins_per_visit >= 10` AND
- User claimed it less than 1 hour ago

**Reappears when:** 1 hour passes since last claim

**Example:**
```
10-coin campaign:
- Claim at 10:00 AM → Campaign DISAPPEARS ❌
- 10:30 AM → Still hidden (30 min cooldown remaining)
- 11:00 AM → Campaign REAPPEARS ✅
```

**Example (7-coin campaign):**
```
7-coin campaign:
- Claim at 10:00 AM → Campaign STILL VISIBLE ✅ (no cooldown for <10 coins)
- Can claim again immediately
```

### 3. Rotation Window Filter

**Campaign disappears when:**
- It was recently shown to user
- Time since last shown < rotation window

**Rotation Windows:**
- HIGH (≥10 coins): 6 hours
- MEDIUM (5-9.99 coins): 3 hours
- LOW (<5 coins): 1 hour

**Purpose:** Ensures variety - prevents same campaigns from dominating the queue

---

## SQL Logic (Lines 335-353)

### Daily Limit Check
```sql
AND (
  uca.attempt_count_24h IS NULL                              -- Never attempted
  OR uca.last_claimed_at IS NULL                             -- Never claimed
  OR TIMESTAMPDIFF(HOUR, uca.last_claimed_at, NOW()) >= 24  -- 24h passed, reset
  OR uca.attempt_count_24h < daily_limit                     -- Under limit
)
```

### Cooldown Check (≥10 coins only)
```sql
AND (
  c.coins_per_visit < 10                                     -- Not high-value, skip check
  OR uca.last_claimed_at IS NULL                             -- Never claimed
  OR TIMESTAMPDIFF(SECOND, uca.last_claimed_at, NOW()) >= 3600  -- 1h passed
)
```

---

## User Experience Flow

### Scenario 1: 10-Coin Campaign

**Timeline:**
```
10:00 AM - User sees campaign in queue
         ↓
         Click "Visit & Earn"
         ↓
         Watch video (30s)
         ↓
         Take quiz → Pass (4/5)
         ↓
         Claim reward → Success! +10 coins
         ↓
10:02 AM - User returns to Earn page
         → Campaign GONE from queue ❌
         → Cooldown: 58 minutes remaining
         ↓
11:00 AM - User refreshes Earn page
         → Campaign REAPPEARS in queue ✅
         ↓
         Claim again → Success! +10 coins
         → Campaign GONE again ❌ (daily limit reached: 2/2)
         ↓
Next Day - Campaign REAPPEARS (limit reset)
```

### Scenario 2: 7-Coin Campaign

**Timeline:**
```
10:00 AM - User sees campaign in queue
         ↓
         Claim → Success! +7 coins
         ↓
10:02 AM - User returns to Earn page
         → Campaign STILL VISIBLE ✅ (no cooldown!)
         ↓
         Claim again → Success! +7 coins
         → Still visible ✅
         ↓
         Claim 3rd time → Success! +7 coins
         → Campaign GONE ❌ (daily limit: 3/3)
         ↓
Next Day - Campaign REAPPEARS
```

### Scenario 3: Failed Quiz (Any Campaign)

**Timeline:**
```
10:00 AM - Start 10-coin campaign
         ↓
         Take quiz → Fail (2/5)
         ↓
         Return to Earn page
         → Campaign STILL VISIBLE ✅
         → No cooldown, no counter increment
         ↓
         Try again immediately → Allowed!
         ↓
         Take quiz → Pass (4/5)
         ↓
         Claim → Success!
         → NOW campaign disappears ❌
```

---

## Visual Representation

### HIGH Tier (≥10 coins, Limit: 2, Cooldown: 1h)

```
┌─────────────────────────────────────────────────────────┐
│ Day 1                                                   │
├─────────────────────────────────────────────────────────┤
│ 10:00 AM │ Claim #1 → ✅ Campaign hidden for 1h       │
│ 11:00 AM │ Campaign reappears ✅                       │
│ 11:05 AM │ Claim #2 → ✅ Campaign hidden (limit 2/2)  │
│ 12:00 PM │ Still hidden (limit reached)                │
│ 6:00 PM  │ Still hidden (limit reached)                │
├─────────────────────────────────────────────────────────┤
│ Day 2                                                   │
├─────────────────────────────────────────────────────────┤
│ 10:01 AM │ Campaign reappears ✅ (limit reset)        │
│ 10:05 AM │ Claim #1 → ✅ Campaign hidden for 1h       │
└─────────────────────────────────────────────────────────┘
```

### MEDIUM Tier (5-9.99 coins, Limit: 3, No Cooldown)

```
┌─────────────────────────────────────────────────────────┐
│ Day 1                                                   │
├─────────────────────────────────────────────────────────┤
│ 10:00 AM │ Claim #1 → ✅ Campaign still visible       │
│ 10:05 AM │ Claim #2 → ✅ Campaign still visible       │
│ 10:10 AM │ Claim #3 → ✅ Campaign hidden (limit 3/3)  │
│ 12:00 PM │ Still hidden (limit reached)                │
├─────────────────────────────────────────────────────────┤
│ Day 2                                                   │
├─────────────────────────────────────────────────────────┤
│ 10:01 AM │ Campaign reappears ✅ (limit reset)        │
└─────────────────────────────────────────────────────────┘
```

### LOW Tier (<5 coins, Limit: 5, No Cooldown)

```
┌─────────────────────────────────────────────────────────┐
│ Same as MEDIUM, but limit is 5 claims/day              │
│ No cooldown - can claim repeatedly until limit reached │
└─────────────────────────────────────────────────────────┘
```

---

## Benefits

✅ **Better UX** - Users don't waste time on campaigns they can't claim
✅ **No frustration** - No "cooldown error" after completing video/quiz
✅ **Clear availability** - If it's in queue, you can claim it
✅ **Smart filtering** - Balances exposure across campaigns
✅ **Fair rotation** - All campaigns get visibility

---

## Database Tables Used

### `user_campaign_activity`
- `attempt_count_24h` - How many times user claimed this campaign today
- `last_claimed_at` - When user last successfully claimed

### `campaign_rotation_tracking`
- `last_served_at` - When campaign was last shown in this user's queue
- Used to prevent showing same campaigns too often

---

## Testing

### Test 1: Cooldown Visibility
1. Claim a 10-coin campaign
2. Check queue → Should NOT see that campaign ❌
3. Wait 1 hour
4. Check queue → Should see campaign again ✅

### Test 2: No Cooldown for <10 Coins
1. Claim a 7-coin campaign
2. Check queue immediately → Should STILL see it ✅
3. Claim again → Should work ✅

### Test 3: Daily Limit Visibility
1. Claim HIGH tier campaign 2 times
2. Check queue → Should NOT see it ❌
3. Next day → Should see it again ✅

### Test 4: Failed Quiz Doesn't Hide
1. Start any campaign
2. Fail quiz
3. Check queue → Campaign should STILL be visible ✅

---

**Result:** Smart, user-friendly queue that only shows campaigns the user can actually claim!
