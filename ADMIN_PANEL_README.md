# Admin Panel - Setup & Usage Guide

## Overview

The Admin Panel is a comprehensive internal tool for managing EngageSwap platform operations, including:
- User management and coin adjustments
- Campaign limit configuration (daily limits, cooldown periods)
- System monitoring and analytics
- Audit logs and enforcement tracking

---

## Initial Setup

### 1. Create Admin User

Run the seed script to create the admin account:

```bash
cd engage-backend
node scripts/seedAdmin.js
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@engageswap.com`

⚠️ **IMPORTANT:** Change the admin password after first login!

### 2. Verify Database Tables

Ensure all required tables exist by checking your database:
- `users` (with `is_admin` field)
- `campaign_limit_config`
- `campaign_enforcement_logs`
- `user_campaign_activity`
- `campaign_rotation_tracking`

---

## Accessing the Admin Panel

1. **Login** as admin using the credentials above
2. Navigate to **`/admin`** or click the **"Admin"** link in the header (only visible to admin users)
3. The admin dashboard will display system statistics and quick actions

---

## Features

### 1. Dashboard (`/admin`)

**Displays:**
- Total users and platform coin balance
- Total campaigns and visit statistics
- Enforcement outcomes (last 24 hours)
- Top earners (last 7 days)

**Quick Links:**
- User Management
- Campaign Limits Configuration
- Audit Logs
- Campaign Overview

---

### 2. Campaign Limits Configuration (`/admin/limits`)

**Purpose:** Control how users can claim campaigns based on value tiers

#### Configurable Settings:

##### **attempt_limits**
Daily successful claim limits per tier:
- **HIGH tier** (≥10 coins): Default 2 attempts/day
- **MEDIUM tier** (5-9.99 coins): Default 3 attempts/day
- **LOW tier** (<5 coins): Default 5 attempts/day

**Example: Increase HIGH tier limit from 2 to 5:**
1. Go to `/admin/limits`
2. Find "attempt_limits" config
3. Click "Edit"
4. Change HIGH value from `2` to `5`
5. Click "Save Changes"

##### **cooldown_seconds**
Wait time between claims (only for campaigns ≥10 coins):
- Default: 3600 seconds (1 hour)
- Set to 0 to disable cooldown
- Conversions: 1800 = 30 min, 3600 = 1 hr, 7200 = 2 hrs

**Example: Change cooldown from 1 hour to 30 minutes:**
1. Go to `/admin/limits`
2. Find "cooldown_seconds" config
3. Click "Edit"
4. Change value from `3600` to `1800`
5. Click "Save Changes"

##### **value_thresholds**
Coin amounts that define tier boundaries:
- **HIGH threshold**: ≥10 coins (default)
- **MEDIUM threshold**: ≥5 coins (default)

##### **rotation_windows**
Time before showing campaign again in queue:
- **HIGH**: 6 hours (21600 seconds)
- **MEDIUM**: 3 hours (10800 seconds)
- **LOW**: 1 hour (3600 seconds)

---

### 3. User Management (`/admin/users`)

**Features:**
- Search users by username or email
- View user details (balance, campaigns, visits)
- Adjust user coin balances (add/subtract)
- View enforcement logs per user
- Pagination for large user bases

**Adjust User Coins:**
1. Search for user or browse list
2. Click "View Details"
3. Click "Adjust Coins" button
4. Enter amount (positive to add, negative to subtract)
5. Provide reason for adjustment
6. Confirm

---

### 4. Campaign Management (`/admin/campaigns`)

**Features:**
- View all campaigns with filters (active, paused, finished)
- See campaign progress and statistics
- Monitor campaign owners
- Track completion rates

**Filters:**
- **All Campaigns**: Show everything
- **Active**: Running campaigns
- **Paused**: Temporarily stopped
- **Finished**: Reached click limit

---

### 5. Enforcement Logs (`/admin/logs`)

**Purpose:** Monitor campaign limit enforcement and user activity

**Log Types:**
- **ALLOW**: User successfully claimed reward
- **LIMIT_REACHED**: User hit daily limit
- **COOLDOWN_ACTIVE**: User in cooldown period

**Filters:**
- Filter by outcome (ALLOW, LIMIT_REACHED, COOLDOWN_ACTIVE)
- Filter by tier (HIGH, MEDIUM, LOW)
- Pagination support

**Use Cases:**
- Identify users hitting limits frequently
- Monitor system enforcement effectiveness
- Debug user complaints about restrictions

---

## Common Admin Tasks

### Task 1: Increase Limit for 10-Coin Campaigns

**Scenario:** You want HIGH tier campaigns (≥10 coins) to allow 5 attempts/day instead of 2

**Steps:**
1. Navigate to `/admin/limits`
2. Find "attempt_limits" section
3. Click "Edit"
4. Change `high: 2` to `high: 5`
5. Click "Save Changes"
6. Configuration takes effect immediately (cached for 5 minutes)

---

### Task 2: Disable Cooldown Entirely

**Scenario:** You want to remove the 1-hour cooldown for HIGH tier campaigns

**Steps:**
1. Navigate to `/admin/limits`
2. Find "cooldown_seconds" section
3. Click "Edit"
4. Change value from `3600` to `0`
5. Click "Save Changes"
6. Users can now claim ≥10 coin campaigns repeatedly (within daily limits)

---

### Task 3: Give User Bonus Coins

**Scenario:** User reported a bug, and you want to compensate them with 50 coins

**Steps:**
1. Navigate to `/admin/users`
2. Search for the user by username
3. Click "View Details"
4. Click "Adjust Coins"
5. Enter amount: `50`
6. Enter reason: "Compensation for bug report"
7. Click "Confirm Adjustment"

---

### Task 4: Investigate User Hitting Limits

**Scenario:** User claims they can't earn from campaigns anymore

**Steps:**
1. Navigate to `/admin/users`
2. Search for user
3. Click "View Details"
4. Scroll to "Enforcement Logs" section
5. Check recent logs:
   - If `LIMIT_REACHED`: User hit daily limit (show them the reset time)
   - If `COOLDOWN_ACTIVE`: User is in cooldown period (explain 1-hour wait)
   - Check `value_tier` to see which tier triggered the limit

---

## Security Notes

⚠️ **Admin Access Control:**
- Admin routes require authentication AND `is_admin = 1` in database
- Non-admin users receive `403 FORBIDDEN` error
- Admin link in header only shows for admin users

⚠️ **Audit Trail:**
- All coin adjustments are logged to console
- Consider creating a dedicated `admin_actions` table for persistent logging

⚠️ **Configuration Changes:**
- Changes to limits take effect immediately
- Config is cached for 5 minutes to reduce database queries
- No restart required

---

## API Endpoints (Backend)

All admin endpoints are protected and require `is_admin = 1`:

```
GET  /admin/stats                       - Dashboard statistics
GET  /admin/users                       - List users (with search/pagination)
GET  /admin/users/:id                   - User details
POST /admin/users/:id/adjust-coins      - Adjust user balance
GET  /admin/limits                      - Get campaign limits config
PUT  /admin/limits/:key                 - Update config value
GET  /admin/enforcement-logs            - Get enforcement logs
GET  /admin/campaigns                   - List campaigns
```

---

## Troubleshooting

### Admin Link Not Showing
- Check that user's `is_admin` field is `1` in database
- Log out and log back in to refresh user session

### Forbidden Error on Admin Pages
- User doesn't have `is_admin = 1`
- Run: `UPDATE users SET is_admin = 1 WHERE username = 'admin';`

### Config Changes Not Applying
- Changes are cached for 5 minutes
- Wait 5 minutes or restart backend server

### Can't Login as Admin
- Verify admin user exists: `SELECT * FROM users WHERE username = 'admin';`
- Re-run seed script: `node scripts/seedAdmin.js`

---

## Future Enhancements (Optional)

Potential additions for admin panel:
- [ ] Ban/suspend user accounts
- [ ] Delete campaigns
- [ ] Bulk coin adjustments
- [ ] Export logs to CSV
- [ ] Real-time dashboard with WebSocket updates
- [ ] Email notifications for critical events
- [ ] Admin action audit table
- [ ] Multi-admin role support

---

## Questions?

For questions about the admin panel or to request new features, contact the development team or create an issue in the project repository.
