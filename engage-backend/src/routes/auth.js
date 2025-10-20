const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const config = require('../config');
const { signToken } = require('../utils/jwt');
const {
  validateUsername,
  validateEmail,
  validatePassword,
  sanitizeInput,
} = require('../utils/validation');
const { createOTP, canResendOTP, verifyOTP } = require('../utils/otp');
const { sendVerificationEmail } = require('../utils/mailer');
const { generatePublicId } = require('../utils/publicId');
const { getClientIp } = require('../utils/ipAddress');

const router = express.Router();

const BCRYPT_ROUNDS = 12;

/**
 * POST /auth/signup
 * Create a new user account
 */
router.post('/signup', async (req, res, next) => {
  try {
    // Sanitize inputs
    const username = sanitizeInput(req.body.username, 32);
    const email = sanitizeInput(req.body.email, 191);
    const password = req.body.password;

    // Validate inputs
    const usernameError = validateUsername(username);
    if (usernameError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: usernameError },
      });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: emailError },
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: passwordError },
      });
    }

    // Normalize for uniqueness check
    const usernameLower = username.toLowerCase();
    const emailLower = email.toLowerCase();

    // Check for existing user (username or email) in both users and pending_users tables
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username_lower = ? OR email_lower = ? LIMIT 1',
      [usernameLower, emailLower]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_USER',
          message: 'Username or email already exists',
        },
      });
    }

    // Also check pending_users to prevent duplicate signups
    const [pendingExisting] = await db.query(
      'SELECT id FROM pending_users WHERE username_lower = ? OR email_lower = ? LIMIT 1',
      [usernameLower, emailLower]
    );

    if (pendingExisting.length > 0) {
      // Delete old pending entry and allow re-registration
      await db.query(
        'DELETE FROM pending_users WHERE username_lower = ? OR email_lower = ?',
        [usernameLower, emailLower]
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Get client IP address
    const ipAddress = getClientIp(req);

    // Calculate expiry time (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Insert into pending_users table (data will be moved to users table after OTP verification)
    const [result] = await db.query(
      `INSERT INTO pending_users (username, username_lower, email, email_lower, password_hash, ip_address, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, usernameLower, email, emailLower, passwordHash, ipAddress, expiresAt]
    );

    const pendingUserId = result.insertId;

    console.log(`[Auth] Created pending user ${pendingUserId} (${username}), expires at ${expiresAt.toISOString()}`);

    // Generate and store OTP using pending_users.id
    // Pass isPending=true to store in pending_user_otps table
    const { code } = await createOTP(pendingUserId, 'email_verification', true);

    // Send verification email
    await sendVerificationEmail(email, code);

    res.status(201).json({ pending: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/verify-email
 * Verify email with OTP code and create user account
 */
router.post('/verify-email', async (req, res, next) => {
  try {
    const emailOrUsername = sanitizeInput(req.body.emailOrUsername, 191);
    const code = sanitizeInput(req.body.code, 6);

    if (!emailOrUsername || !code) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email/username and code are required',
        },
      });
    }

    // Find pending user by username or email
    const identifierLower = emailOrUsername.toLowerCase();
    const [pendingUsers] = await db.query(
      `SELECT id, username, username_lower, email, email_lower, password_hash, ip_address, expires_at
       FROM pending_users
       WHERE username_lower = ? OR email_lower = ?
       LIMIT 1`,
      [identifierLower, identifierLower]
    );

    if (pendingUsers.length === 0) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid verification code or registration expired',
        },
      });
    }

    const pendingUser = pendingUsers[0];

    // Check if pending user has expired
    if (new Date(pendingUser.expires_at) < new Date()) {
      // Clean up expired pending user
      await db.query('DELETE FROM pending_users WHERE id = ?', [pendingUser.id]);
      return res.status(401).json({
        error: {
          code: 'REGISTRATION_EXPIRED',
          message: 'Registration expired. Please sign up again',
        },
      });
    }

    // Verify OTP - use isPending=true to check pending_user_otps table
    const result = await verifyOTP(pendingUser.id, code, 'email_verification', true, true);

    if (!result.success) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CODE',
          message: result.error || 'Invalid verification code',
        },
      });
    }

    // OTP verified successfully - now create the actual user account
    const [userResult] = await db.query(
      `INSERT INTO users (username, username_lower, email, email_lower, password_hash, coins, is_admin, email_verified_at, ip_address)
       VALUES (?, ?, ?, ?, ?, 20, 0, NOW(), ?)`,
      [
        pendingUser.username,
        pendingUser.username_lower,
        pendingUser.email,
        pendingUser.email_lower,
        pendingUser.password_hash,
        pendingUser.ip_address
      ]
    );

    const userId = userResult.insertId;

    // Generate and set public_id
    const publicId = generatePublicId('USR', userId);
    await db.query('UPDATE users SET public_id = ? WHERE id = ?', [publicId, userId]);

    // Create wallet with 20 initial coins
    await db.query(
      `INSERT INTO wallets (user_id, available, locked, lifetime_earned)
       VALUES (?, 20.000, 0.000, 20.000)`,
      [userId]
    );

    console.log(`[Auth] User ${userId} (${pendingUser.username}) created successfully with wallet balance: 20 coins`);

    // Delete pending user record
    await db.query('DELETE FROM pending_users WHERE id = ?', [pendingUser.id]);

    // Sign JWT token
    const token = signToken({
      id: userId,
      username: pendingUser.username,
      email: pendingUser.email,
      is_admin: 0,
    });

    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/resend-otp
 * Resend verification OTP for pending users
 */
router.post('/resend-otp', async (req, res, next) => {
  try {
    const emailOrUsername = sanitizeInput(req.body.emailOrUsername, 191);

    if (!emailOrUsername) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email or username is required',
        },
      });
    }

    // Find pending user by username or email
    const identifierLower = emailOrUsername.toLowerCase();
    const [pendingUsers] = await db.query(
      `SELECT id, email, expires_at
       FROM pending_users
       WHERE username_lower = ? OR email_lower = ?
       LIMIT 1`,
      [identifierLower, identifierLower]
    );

    // Don't leak whether user exists - always return 200
    if (pendingUsers.length === 0) {
      return res.status(200).json({ ok: true });
    }

    const pendingUser = pendingUsers[0];

    // Check if pending user has expired
    if (new Date(pendingUser.expires_at) < new Date()) {
      // Clean up expired pending user
      await db.query('DELETE FROM pending_users WHERE id = ?', [pendingUser.id]);
      return res.status(401).json({
        error: {
          code: 'REGISTRATION_EXPIRED',
          message: 'Registration expired. Please sign up again',
        },
      });
    }

    // Check cooldown - use isPending=true
    const canSend = await canResendOTP(pendingUser.id, true);
    if (!canSend) {
      return res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Please wait 60 seconds before requesting another code',
        },
      });
    }

    // Generate new OTP - use isPending=true
    const { code } = await createOTP(pendingUser.id, 'email_verification', true);

    // Send email
    await sendVerificationEmail(pendingUser.email, code);

    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/forgot-password
 * Request password reset OTP
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const identifier = sanitizeInput(req.body.identifier, 191);

    if (!identifier) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email or username is required',
        },
      });
    }

    // Find user by username or email
    const identifierLower = identifier.toLowerCase();
    const [users] = await db.query(
      `SELECT id, email, email_verified_at
       FROM users
       WHERE username_lower = ? OR email_lower = ?
       LIMIT 1`,
      [identifierLower, identifierLower]
    );

    // Show error if user doesn't exist
    if (users.length === 0) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'This user is not registered',
        },
      });
    }

    const user = users[0];

    // Only allow password reset for verified accounts
    if (!user.email_verified_at) {
      return res.status(403).json({
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email first',
        },
      });
    }

    // Check cooldown
    const canSend = await canResendOTP(user.id);
    if (!canSend) {
      return res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Please wait 60 seconds before requesting another code',
        },
      });
    }

    // Generate OTP for password reset
    const { code } = await createOTP(user.id, 'password_reset');

    // Send password reset email
    const { sendPasswordResetEmail } = require('../utils/mailer');
    await sendPasswordResetEmail(user.email, code);

    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/verify-reset-code
 * Verify OTP code for password reset (step 1)
 */
router.post('/verify-reset-code', async (req, res, next) => {
  try {
    const identifier = sanitizeInput(req.body.identifier, 191);
    const code = sanitizeInput(req.body.code, 6);

    if (!identifier || !code) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email/username and code are required',
        },
      });
    }

    // Find user by username or email
    const identifierLower = identifier.toLowerCase();
    const [users] = await db.query(
      `SELECT id, username, email
       FROM users
       WHERE username_lower = ? OR email_lower = ?
       LIMIT 1`,
      [identifierLower, identifierLower]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid verification code',
        },
      });
    }

    const user = users[0];

    // Verify OTP without consuming it (we'll consume it when password is set)
    const result = await verifyOTP(user.id, code, 'password_reset', false);

    if (!result.success) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CODE',
          message: result.error || 'Invalid or expired verification code',
        },
      });
    }

    // OTP is valid - return success (don't consume it yet, we'll consume it when password is set)
    res.status(200).json({
      ok: true,
      message: 'Code verified successfully'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/reset-password
 * Set new password after OTP verification (step 2)
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const identifier = sanitizeInput(req.body.identifier, 191);
    const code = sanitizeInput(req.body.code, 6);
    const newPassword = req.body.newPassword;

    if (!identifier || !code || !newPassword) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required',
        },
      });
    }

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: passwordError },
      });
    }

    // Find user by username or email
    const identifierLower = identifier.toLowerCase();
    const [users] = await db.query(
      `SELECT id, username, email, is_admin, email_verified_at
       FROM users
       WHERE username_lower = ? OR email_lower = ?
       LIMIT 1`,
      [identifierLower, identifierLower]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid verification code',
        },
      });
    }

    const user = users[0];

    // Verify OTP and consume it this time
    const result = await verifyOTP(user.id, code, 'password_reset', true);

    if (!result.success) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CODE',
          message: result.error || 'Invalid or expired verification code',
        },
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, user.id]
    );

    console.log(`[Auth] Password reset successful for user ${user.id} (${user.username})`);

    // Return success without logging in - user will be redirected to login page
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/login
 * Authenticate user with username/email + password
 */
router.post('/login', async (req, res, next) => {
  try {
    // Sanitize inputs
    const identifier = sanitizeInput(req.body.identifier, 191);
    const password = req.body.password;

    // Basic validation
    if (!identifier || !password) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
        },
      });
    }

    // Normalize identifier for case-insensitive lookup
    const identifierLower = identifier.toLowerCase();

    // Find user by username or email (case-insensitive)
    const [users] = await db.query(
      `SELECT id, username, email, password_hash, is_admin, is_disabled, coins, email_verified_at
       FROM users
       WHERE username_lower = ? OR email_lower = ?
       LIMIT 1`,
      [identifierLower, identifierLower]
    );

    if (users.length === 0) {
      // Generic error - don't leak if user exists
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
        },
      });
    }

    const user = users[0];

    // Check if account is disabled
    if (user.is_disabled) {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been disabled. Please contact support.',
        },
      });
    }

    // Block admin login via password - admins must use OTP login
    if (user.is_admin) {
      return res.status(403).json({
        error: {
          code: 'ADMIN_OTP_REQUIRED',
          message: 'Admin users must login using OTP. Please use the admin login page.',
        },
        redirectTo: '/admin-login',
      });
    }

    // Verify password (constant-time comparison via bcrypt)
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
        },
      });
    }

    // Check if email is verified
    if (!user.email_verified_at) {
      return res.status(403).json({
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before logging in',
        },
        canResend: true,
      });
    }

    // Update IP address on login
    const ipAddress = getClientIp(req);
    await db.query(
      'UPDATE users SET ip_address = ? WHERE id = ?',
      [ipAddress, user.id]
    );

    // Sign JWT
    const token = signToken({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
    });

    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/admin-login
 * Request OTP for admin login (email configured in .env)
 * No email required in request - uses ADMIN_DB_EMAIL for lookup, ADMIN_OTP_EMAIL for sending
 */
router.post('/admin-login', async (req, res, next) => {
  try {
    // Use admin DB email from config to find user
    const dbEmail = config.ADMIN_DB_EMAIL;
    const dbEmailLower = dbEmail.toLowerCase();
    const [users] = await db.query(
      `SELECT id, username, email, is_admin, is_disabled
       FROM users
       WHERE email_lower = ?
       LIMIT 1`,
      [dbEmailLower]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Admin account not found',
        },
      });
    }

    const user = users[0];

    // Verify user is admin
    if (!user.is_admin) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'This account does not have admin privileges',
        },
      });
    }

    // Check if account is disabled
    if (user.is_disabled) {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'This account has been disabled',
        },
      });
    }

    // Check cooldown
    const canSend = await canResendOTP(user.id);
    if (!canSend) {
      return res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Please wait 60 seconds before requesting another code',
        },
      });
    }

    // Generate OTP for admin login
    const { code } = await createOTP(user.id, 'admin_login');

    // Send OTP email to configured delivery address (not the DB email)
    const deliveryEmail = config.ADMIN_OTP_EMAIL;
    await sendVerificationEmail(deliveryEmail, code);

    console.log(`[Auth] Admin login OTP sent to ${deliveryEmail} for user ${user.id} (${user.username})`);

    res.status(200).json({
      ok: true,
      message: 'OTP sent to your email',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/admin-verify-otp
 * Verify OTP for admin login
 * No email required - uses ADMIN_DB_EMAIL from .env for lookup
 */
router.post('/admin-verify-otp', async (req, res, next) => {
  try {
    const code = sanitizeInput(req.body.code, 6);

    if (!code) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Code is required',
        },
      });
    }

    // Use admin DB email from config to find user
    const dbEmail = config.ADMIN_DB_EMAIL;
    const dbEmailLower = dbEmail.toLowerCase();
    const [users] = await db.query(
      `SELECT id, username, email, is_admin, is_disabled
       FROM users
       WHERE email_lower = ?
       LIMIT 1`,
      [dbEmailLower]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid verification code',
        },
      });
    }

    const user = users[0];

    // Verify user is admin
    if (!user.is_admin) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'This account does not have admin privileges',
        },
      });
    }

    // Check if account is disabled
    if (user.is_disabled) {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'This account has been disabled',
        },
      });
    }

    // Verify OTP
    const result = await verifyOTP(user.id, code, 'admin_login', true);

    if (!result.success) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CODE',
          message: result.error || 'Invalid verification code',
        },
      });
    }

    // Update IP address on login
    const ipAddress = getClientIp(req);
    await db.query('UPDATE users SET ip_address = ? WHERE id = ?', [ipAddress, user.id]);

    // Sign JWT
    const token = signToken({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
    });

    console.log(`[Auth] Admin ${user.username} (${user.id}) logged in successfully via OTP`);

    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
