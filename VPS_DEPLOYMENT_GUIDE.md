# VPS Deployment Guide - Complete Setup

## Step-by-Step Instructions for Fresh Database Setup on Ubuntu VPS

### 1. Connect to Your VPS

```bash
ssh ubuntu@your-vps-ip
cd ~/engage-swap
```

### 2. Pull Latest Code

```bash
git pull origin wallet-model  # or your branch name
```

### 3. Database Setup

#### Option A: Fresh Database (Recommended)

```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE IF NOT EXISTS engage_swap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'engage_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON engage_swap.* TO 'engage_user'@'localhost';
FLUSH PRIVILEGES;
USE engage_swap;
EXIT;
```

#### Step 3.1: Import Database Schema

```bash
# Import the complete schema
mysql -u engage_user -p engage_swap < engage-backend/db/Dump20251015.sql
```

#### Step 3.2: Create `pending_user_otps` Table (NEW - CRITICAL!)

```bash
# Create the new table for pending user OTPs
mysql -u engage_user -p engage_swap < engage-backend/db/migrations/fix_otp_foreign_key.sql
```

#### Step 3.3: Import Seed Data

```bash
# Insert all configuration data
mysql -u engage_user -p engage_swap < engage-backend/db/seed_data.sql
```

### 4. Verify Database Setup

```bash
mysql -u engage_user -p engage_swap

# Run these verification queries:
SHOW TABLES;
SELECT COUNT(*) FROM campaign_limit_config;
SELECT COUNT(*) FROM url_validator_config;
SELECT COUNT(*) FROM coin_packs;
SELECT COUNT(*) FROM market_settings;
DESCRIBE pending_user_otps;  -- Should exist now!

EXIT;
```

**Expected Results:**
- `campaign_limit_config`: 6 rows
- `url_validator_config`: 8 rows
- `coin_packs`: 6 rows
- `market_settings`: 1 row
- `pending_user_otps`: Table should exist with columns

### 5. Update Backend .env File

```bash
cd ~/engage-swap/engage-backend
nano .env.production  # or vi/vim
```

Make sure these are set:

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=engage_user
DB_PASSWORD=your_secure_password
DB_NAME=engage_swap
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=https://engageswap.in,https://www.engageswap.in

# Email settings for OTP
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=noreply@engageswap.in

# Admin OTP settings
ADMIN_DB_EMAIL=abubakar.jawed@gmail.com
ADMIN_OTP_EMAIL=abubakar.jawed@gmail.com
```

### 6. Restart Backend Service

```bash
sudo systemctl restart engageswap.service
```

### 7. Check Logs (IMPORTANT!)

```bash
# Watch logs in real-time
sudo journalctl -u engageswap.service -f
```

**What to Look For:**
- ✅ `[Server] ✓ Database connected successfully`
- ✅ `[Server] Running on port 3000`
- ✅ No "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR" errors
- ✅ No foreign key constraint errors

### 8. Test the Application

#### Test 1: Check API Health
```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok"}`

#### Test 2: Test Signup Flow

1. Go to your website: `https://engageswap.in/signup`
2. Try to sign up with a new user
3. Check logs: `sudo journalctl -u engageswap.service -n 50`
4. You should see:
   - `[Auth] Created pending user X`
   - `[OTP] Generated for pending user X (email_verification): XXXXXX`
   - No errors!

#### Test 3: Check Email

- Check your email inbox for the OTP
- Verify the OTP code in the verification page

#### Test 4: Admin Login

1. Go to: `https://engageswap.in/admin-login`
2. OTP should be sent to admin email
3. Verify with OTP code

### 9. Optional: Reset AUTO_INCREMENT (If You Want Clean IDs)

⚠️ **Only run this if your database is completely empty!**

```bash
mysql -u engage_user -p engage_swap < engage-backend/db/migrations/reset_auto_increment.sql
```

### 10. Create Admin User

If you haven't created an admin user yet:

```bash
# Run the seedAdmin script
cd ~/engage-swap/engage-backend
node scripts/seedAdmin.js
```

Or manually:

```bash
mysql -u engage_user -p engage_swap

# First, signup as a normal user through the website
# Then, make that user an admin:
UPDATE users SET is_admin = 1 WHERE email_lower = 'abubakar.jawed@gmail.com';

# Verify:
SELECT id, username, email, is_admin FROM users WHERE email_lower = 'abubakar.jawed@gmail.com';

EXIT;
```

## Troubleshooting

### Issue 1: Foreign Key Constraint Error

**Error:** `Cannot add or update a child row: a foreign key constraint fails (email_otps, CONSTRAINT email_otps_ibfk_1)`

**Solution:**
```bash
# Make sure pending_user_otps table exists
mysql -u engage_user -p engage_swap -e "DESCRIBE pending_user_otps;"

# If not, create it:
mysql -u engage_user -p engage_swap < engage-backend/db/migrations/fix_otp_foreign_key.sql
```

### Issue 2: Trust Proxy Error

**Error:** `ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false`

**Solution:** This should be fixed in the latest code. If you still see it:
```bash
# Pull latest code
git pull
sudo systemctl restart engageswap.service
```

### Issue 3: No Seed Data

**Symptom:** Coin packs or URL validator not working

**Solution:**
```bash
mysql -u engage_user -p engage_swap < engage-backend/db/seed_data.sql
```

### Issue 4: Service Won't Start

```bash
# Check service status
sudo systemctl status engageswap.service

# Check full logs
sudo journalctl -u engageswap.service -n 100

# Common issues:
# - Wrong DB credentials in .env
# - DB not accessible
# - Port 3000 already in use
```

## Files Created/Modified

### New Files:
1. `engage-backend/db/migrations/fix_otp_foreign_key.sql` - Creates `pending_user_otps` table
2. `engage-backend/db/migrations/reset_auto_increment.sql` - Resets AUTO_INCREMENT counters
3. `engage-backend/db/seed_data.sql` - All essential configuration data
4. `DEPLOYMENT_FIX.md` - Detailed fix guide
5. `AUTO_INCREMENT_EXPLAINED.md` - Explains ID gaps
6. `VPS_DEPLOYMENT_GUIDE.md` - This file

### Modified Files:
1. `engage-backend/server.js` - Added `app.set('trust proxy', 1);`
2. `engage-backend/src/utils/otp.js` - Added support for pending users
3. `engage-backend/src/routes/auth.js` - Updated to use `isPending=true` flag
4. `engage-frontend/src/lib/api.js` - Clear admin OTP session on logout
5. `engage-frontend/src/pages/AdminLogin.jsx` - Fixed double OTP sending
6. `engage-frontend/src/pages/Promote.jsx` - Updated button colors

## Quick Command Reference

```bash
# View logs in real-time
sudo journalctl -u engageswap.service -f

# Restart service
sudo systemctl restart engageswap.service

# Check service status
sudo systemctl status engageswap.service

# View last 100 log lines
sudo journalctl -u engageswap.service -n 100

# MySQL login
mysql -u engage_user -p engage_swap

# Import SQL file
mysql -u engage_user -p engage_swap < file.sql

# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx
```

## Success Indicators

✅ Backend starts without errors
✅ Database connects successfully
✅ Users can sign up and receive OTP
✅ Email verification works
✅ Admin login works with OTP
✅ No foreign key errors in logs
✅ No trust proxy errors in logs
✅ Coin packs are visible in market
✅ Campaign creation works

## Support

If you encounter any issues:
1. Check the logs: `sudo journalctl -u engageswap.service -n 100`
2. Verify database tables exist
3. Ensure .env file has correct credentials
4. Check nginx configuration if using reverse proxy
