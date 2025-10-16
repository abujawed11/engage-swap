# Campaign Attempt Limits & Fair Rotation - Implementation Guide

## Overview

This implementation adds a comprehensive per-user campaign attempt limiting system with dynamic limits, cooldowns, and fair rotation to EngageSwap. The system prevents campaign exhaustion by heavy users and ensures balanced exposure across all campaigns.

## Features Implemented

### ✅ A) Dynamic Attempt Limits (based on campaign payout)
- **High-value campaigns** (≥10 coins): 2 attempts per user per 24 hours
- **Medium-value campaigns** (5-9.99 coins): 3 attempts per user per 24 hours
- **Low-value campaigns** (<5 coins): 5 attempts per user per 24 hours

### ✅ B) Cooldown Between Attempts
- **1 hour (3600 seconds)** minimum cooldown between repeat attempts of the same campaign
- Cooldown timer provided in API responses when blocked

### ✅ C) Concurrency Guard
- Only **one active session** per user per campaign at any time
- Active sessions timeout after 10 minutes (configurable)

### ✅ D) Campaign Rotation Fairness
- Campaigns not shown again within rotation window based on tier:
  - **High-value**: 6 hours
  - **Medium-value**: 3 hours
  - **Low-value**: 1 hour
- Randomized order for fairness

### ✅ E) Server-side Enforcement
- All checks are transactional and idempotent
- Atomic operations with database locks

### ✅ F) Structured API Responses
- HTTP 200 with outcome field (not 4xx errors)
- User-friendly error messages
- Retry timing information

### ✅ G) Analytics & Observability
- Comprehensive logging of all enforcement decisions
- Dashboard metrics endpoints
- Campaign exposure balance reports

## Database Schema

### New Tables Created

#### 1. `user_campaign_activity`
Tracks per-user attempt counts and active sessions:
```sql
- id (BIGINT, PK)
- user_id (BIGINT, FK)
- campaign_id (BIGINT, FK)
- attempt_count_24h (INT)
- last_attempt_at (DATETIME)
- last_claimed_at (DATETIME)
- active_session_token (VARCHAR(64))
- active_session_started_at (DATETIME)
- created_at, updated_at (DATETIME)
```

#### 2. `campaign_rotation_tracking`
Tracks when campaigns were last served to each user:
```sql
- id (BIGINT, PK)
- user_id (BIGINT, FK)
- campaign_id (BIGINT, FK)
- last_served_at (DATETIME)
- serve_count (INT)
- created_at, updated_at (DATETIME)
```

#### 3. `campaign_enforcement_logs`
Analytics log of all enforcement decisions:
```sql
- id (BIGINT, PK)
- user_id (BIGINT, FK)
- campaign_id (BIGINT, FK)
- coins_per_visit (DECIMAL(20,3))
- value_tier (ENUM: 'HIGH', 'MEDIUM', 'LOW')
- outcome (ENUM: 'ALLOW', 'LIMIT_REACHED', 'COOLDOWN_ACTIVE', 'ACTIVE_SESSION_EXISTS', 'CAMPAIGN_UNAVAILABLE')
- attempt_count_24h (INT)
- seconds_since_last_attempt (INT)
- retry_after_sec (INT)
- created_at (DATETIME)
```

#### 4. `campaign_limit_config`
Configurable limits and constants:
```sql
- id (INT, PK)
- config_key (VARCHAR(50), UNIQUE)
- config_value (JSON)
- description (VARCHAR(255))
- created_at, updated_at (DATETIME)
```

**Default Configuration:**
```json
{
  "attempt_limits": { "high": 2, "medium": 3, "low": 5 },
  "value_thresholds": { "high": 10, "medium": 5 },
  "cooldown_seconds": { "value": 3600 },
  "rotation_windows": { "high": 21600, "medium": 10800, "low": 3600 },
  "active_session_timeout": { "value": 600 }
}
```

## Migration Files

Run these migrations in order:

1. `017_add_user_campaign_activity.sql` - User activity tracking
2. `018_add_campaign_rotation_tracking.sql` - Rotation fairness
3. `019_add_campaign_enforcement_logs.sql` - Analytics logging
4. `020_add_campaign_limit_config.sql` - Configuration table with seed data

**To apply:**
```bash
cd engage-backend
mysql -u your_user -p engage_swap < migrations/017_add_user_campaign_activity.sql
mysql -u your_user -p engage_swap < migrations/018_add_campaign_rotation_tracking.sql
mysql -u your_user -p engage_swap < migrations/019_add_campaign_enforcement_logs.sql
mysql -u your_user -p engage_swap < migrations/020_add_campaign_limit_config.sql
```

## Backend Implementation

### New Files Created

#### 1. `src/utils/campaignLimits.js`
Core enforcement logic with functions:
- `checkCampaignAttemptEligibility()` - Main enforcement check
- `clearActiveSession()` - Clear session after claim
- `updateRotationTracking()` - Track campaign serves
- `getEligibleCampaignsWithRotation()` - Fair rotation queue
- `loadConfig()` - Load limits from database
- Helper functions for tier classification

#### 2. `src/utils/analytics.js`
Analytics and observability:
- `getEnforcementStatistics()` - Overall enforcement stats
- `getCampaignAnalytics()` - Per-campaign metrics
- `getUserAnalytics()` - Per-user metrics
- `getSystemHealthMetrics()` - System health
- `getCampaignExposureBalance()` - Exposure fairness report

#### 3. `src/routes/analytics.js`
Analytics API endpoints:
- `GET /analytics/enforcement` - Enforcement statistics
- `GET /analytics/campaign/:id` - Campaign-specific analytics
- `GET /analytics/user/:id` - User-specific analytics
- `GET /analytics/me` - Current user analytics
- `GET /analytics/health` - System health
- `GET /analytics/exposure` - Campaign exposure balance

### Modified Files

#### `src/routes/earn.js`
- **POST /earn/start**: Now enforces all limits before issuing token
  - Returns structured outcomes (ALLOW, LIMIT_REACHED, COOLDOWN_ACTIVE, ACTIVE_SESSION_EXISTS)
  - Updates rotation tracking
  - Uses transactional checks

- **POST /earn/claim**: Clears active session after successful claim

- **GET /earn/queue**: Uses fair rotation logic
  - Filters campaigns based on rotation windows
  - Randomizes order
  - Respects value tier windows

#### `server.js`
- Registered `/analytics` router

## Frontend Implementation

### Modified Files

#### `src/pages/Earn.jsx`
Updated `handleVisit()` to handle new enforcement outcomes:
- Checks `outcome` field in response
- Displays user-friendly messages for:
  - `LIMIT_REACHED` - Daily limit reached
  - `COOLDOWN_ACTIVE` - Shows wait time in minutes
  - `ACTIVE_SESSION_EXISTS` - Active session warning
- Refreshes queue after enforcement block

## API Response Format

### Success (Allowed)
```json
{
  "outcome": "ALLOW",
  "token": "abc123...",
  "expires_at": "2025-10-16T12:30:00Z",
  "coins_per_visit": 5.5,
  "watch_duration": 30
}
```

### Limit Reached
```json
{
  "outcome": "LIMIT_REACHED",
  "message": "You've reached your daily limit for this campaign (3 attempts). Try again tomorrow."
}
```

### Cooldown Active
```json
{
  "outcome": "COOLDOWN_ACTIVE",
  "message": "Please wait before retrying this campaign.",
  "retry_after_sec": 2847
}
```

### Active Session Exists
```json
{
  "outcome": "ACTIVE_SESSION_EXISTS",
  "message": "You have an active session for this campaign. Please complete or wait for it to expire."
}
```

## Test Scenarios

### Test Matrix (from specification)

| coins_per_visit | attempts_in_24h | cooldown_elapsed | expected_outcome |
|-----------------|-----------------|------------------|------------------|
| 3               | 2               | yes              | ALLOW            |
| 3               | 5               | yes              | LIMIT_REACHED    |
| 7               | 2               | no (within 1h)   | COOLDOWN_ACTIVE  |
| 7               | 3               | yes              | LIMIT_REACHED    |
| 10              | 2               | yes              | LIMIT_REACHED    |

### Manual Testing Steps

1. **Test Daily Limits:**
   - Create a low-value campaign (3 coins)
   - Attempt it 5 times within 24 hours → Should succeed
   - 6th attempt → Should return LIMIT_REACHED

2. **Test Cooldown:**
   - Attempt a campaign
   - Immediately try again → Should return COOLDOWN_ACTIVE with retry_after_sec
   - Wait 1 hour and retry → Should succeed

3. **Test Active Session:**
   - Start a campaign visit (get token)
   - Try to start the same campaign again without completing → Should return ACTIVE_SESSION_EXISTS

4. **Test Rotation:**
   - View earn queue
   - Note campaigns shown
   - Refresh immediately → Should see different/fewer campaigns based on rotation windows

5. **Test Analytics:**
   - Make several campaign attempts
   - Check `GET /analytics/me` → Should show your activity
   - Check `GET /analytics/health` → Should show system metrics

## Configuration Updates

All limits are now configurable via the `campaign_limit_config` table. To update:

```sql
-- Example: Change high-value limit from 2 to 3
UPDATE campaign_limit_config
SET config_value = JSON_SET(config_value, '$.high', 3)
WHERE config_key = 'attempt_limits';

-- Example: Change cooldown from 1h to 30 minutes
UPDATE campaign_limit_config
SET config_value = JSON_SET(config_value, '$.value', 1800)
WHERE config_key = 'cooldown_seconds';
```

Config cache refreshes every 5 minutes automatically.

## Monitoring & Observability

### Key Metrics to Monitor

1. **Enforcement Outcomes:**
   - ALLOW rate (success rate)
   - LIMIT_REACHED frequency by tier
   - COOLDOWN_ACTIVE triggers
   - ACTIVE_SESSION_EXISTS blocks

2. **Campaign Exposure:**
   - Campaigns with low unique user reach
   - Campaigns being rapidly depleted
   - Rotation window effectiveness

3. **User Behavior:**
   - Average attempts per user per campaign
   - Users hitting limits frequently
   - Active session timeout rate

### Analytics Endpoints Usage

```bash
# Get last 7 days enforcement stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/analytics/enforcement

# Get health metrics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/analytics/health

# Get campaign exposure balance
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/analytics/exposure

# Get your own analytics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/analytics/me
```

## Performance Considerations

1. **Database Indexes:**
   - All tracking tables have appropriate indexes on foreign keys and timestamp columns
   - Composite indexes on (user_id, campaign_id) for fast lookups

2. **Config Caching:**
   - Configuration loaded from DB is cached for 5 minutes
   - Reduces DB queries for every enforcement check

3. **Transaction Scope:**
   - Enforcement checks use minimal transaction scope
   - Locks released as soon as possible

4. **Query Optimization:**
   - Rotation query uses CASE statements to avoid multiple queries
   - RAND() for randomization (consider replacing with application-level shuffling for very high traffic)

## Future Enhancements (Optional)

1. **Dynamic rotation scoring** - Prioritize underexposed campaigns
2. **Weighted randomization** - Balance payout fairness and exposure
3. **Admin overrides** - Per-campaign limit adjustments
4. **IP/device fingerprinting** - Enhanced abuse detection
5. **Real-time dashboard** - Live metrics visualization
6. **A/B testing framework** - Test different limit configurations

## Acceptance Criteria Status

✅ User cannot exceed per-day limit based on campaign value tier
✅ User cannot retry same campaign within 1 hour
✅ Only one active session per user × campaign
✅ Earn feed rotation ensures campaign diversity
✅ All limits enforced server-side and transactional
✅ Responses are idempotent and user-friendly
✅ Campaign exposure across users is balanced
✅ All enforcement events logged for analytics
✅ Configurable limits via database table

## Files Summary

### Created Files:
- `migrations/017_add_user_campaign_activity.sql`
- `migrations/018_add_campaign_rotation_tracking.sql`
- `migrations/019_add_campaign_enforcement_logs.sql`
- `migrations/020_add_campaign_limit_config.sql`
- `src/utils/campaignLimits.js`
- `src/utils/analytics.js`
- `src/routes/analytics.js`

### Modified Files:
- `src/routes/earn.js` (updated /start, /claim, /queue endpoints)
- `src/pages/Earn.jsx` (updated handleVisit to handle new outcomes)
- `server.js` (registered analytics router)

## Deployment Checklist

- [ ] Run all 4 migration files in order
- [ ] Verify `campaign_limit_config` table has seed data
- [ ] Restart backend server to load new code
- [ ] Test basic enforcement scenarios
- [ ] Monitor analytics endpoints
- [ ] Check enforcement logs are being created
- [ ] Verify rotation tracking is working
- [ ] Test frontend error handling

---

**Implementation Complete!** All requirements from the specification have been implemented and are ready for testing.
