# Deployment Fix Guide

## Issues Fixed

1. **Express trust proxy error** - Rate limiting was failing because Express didn't trust the reverse proxy (nginx)
2. **Foreign key constraint error** - OTP system was trying to insert pending user OTPs into a table with foreign key to `users` instead of `pending_users`

## Steps to Deploy on Ubuntu VPS

### 1. Connect to your VPS
```bash
ssh ubuntu@your-vps-ip
cd ~/engage-swap
```

### 2. Pull the latest code
```bash
git pull origin wallet-model  # or your branch name
```

### 3. Run the database migration

First, create the new `pending_user_otps` table:

```bash
mysql -u your_db_user -p engage_swap < engage-backend/db/migrations/fix_otp_foreign_key.sql
```

Or manually run this SQL:

```sql
-- Connect to MySQL
mysql -u your_db_user -p engage_swap

-- Create the new table
CREATE TABLE IF NOT EXISTS `pending_user_otps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pending_user_id` bigint unsigned NOT NULL,
  `code_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `purpose` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'email_verification',
  `attempts` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pending_user_id` (`pending_user_id`),
  KEY `idx_expires_consumed` (`expires_at`,`consumed_at`),
  KEY `idx_purpose` (`purpose`),
  CONSTRAINT `pending_user_otps_ibfk_1` FOREIGN KEY (`pending_user_id`) REFERENCES `pending_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify the table was created
SHOW TABLES LIKE 'pending_user_otps';
DESCRIBE pending_user_otps;

-- Exit MySQL
EXIT;
```

### 4. Restart the backend service

```bash
sudo systemctl restart engageswap.service
```

### 5. Check the logs to verify it's working

```bash
sudo journalctl -u engageswap.service -f
```

You should see:
- No more "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR" errors
- No more foreign key constraint errors when users sign up

### 6. Test the signup flow

Try signing up with a new user to verify:
1. No errors in the logs
2. OTP email is sent successfully
3. User can verify email and complete registration

## What Changed

### Backend Changes:

1. **server.js** - Added `app.set('trust proxy', 1);` to trust the reverse proxy (nginx)

2. **src/utils/otp.js** - Added support for both regular users and pending users:
   - New parameter `isPending` added to all OTP functions
   - Uses `pending_user_otps` table for pending users
   - Uses `email_otps` table for verified users

3. **src/routes/auth.js** - Updated signup and verification routes:
   - `/auth/signup` - Creates OTP with `isPending=true`
   - `/auth/verify-email` - Verifies OTP with `isPending=true`
   - `/auth/resend-otp` - Resends OTP with `isPending=true`

4. **db/migrations/fix_otp_foreign_key.sql** - New table for pending user OTPs

## Rollback Instructions (if needed)

If something goes wrong, you can rollback:

```bash
cd ~/engage-swap
git checkout HEAD~1  # Go back one commit
sudo systemctl restart engageswap.service
```

## Verification

After deployment, verify:

1. Rate limiting works correctly (check logs for no proxy errors)
2. New user signups work (OTP is created and sent)
3. Email verification works (OTP can be verified)
4. Admin login still works (uses `email_otps` table for verified admin users)

## Support

If you encounter any issues, check:
- `sudo journalctl -u engageswap.service -n 100` - Last 100 log lines
- MySQL table exists: `mysql -u user -p -e "USE engage_swap; SHOW TABLES LIKE 'pending_user_otps';"`
- Backend is running: `sudo systemctl status engageswap.service`
