const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
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

    // Check for existing user (username or email)
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Get client IP address
    const ipAddress = getClientIp(req);

    // Insert user (unverified) with 20 welcome coins (deprecated field, kept for backward compatibility)
    const [result] = await db.query(
      `INSERT INTO users (username, username_lower, email, email_lower, password_hash, coins, is_admin, email_verified_at, ip_address)
       VALUES (?, ?, ?, ?, ?, 20, 0, NULL, ?)`,
      [username, usernameLower, email, emailLower, passwordHash, ipAddress]
    );

    const userId = result.insertId;

    // Generate and set public_id
    const publicId = generatePublicId('USR', userId);
    await db.query('UPDATE users SET public_id = ? WHERE id = ?', [publicId, userId]);

    // Create wallet with 20 initial coins
    await db.query(
      `INSERT INTO wallets (user_id, available, locked, lifetime_earned)
       VALUES (?, 20.000, 0.000, 20.000)`,
      [userId]
    );

    console.log(`[Auth] Created new user ${userId} (${username}) with wallet balance: 20 coins`);

    // Check if user can receive OTP (throttle check)
    const canSend = await canResendOTP(userId);
    if (!canSend) {
      return res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Please wait before requesting another verification code',
        },
      });
    }

    // Generate and store OTP
    const { code } = await createOTP(userId);

    // Send verification email
    await sendVerificationEmail(email, code);

    res.status(201).json({ pending: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/verify-email
 * Verify email with OTP code
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

    // Find user by username or email
    const identifierLower = emailOrUsername.toLowerCase();
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

    // Check if already verified
    if (user.email_verified_at) {
      return res.status(409).json({
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email already verified',
        },
      });
    }

    // Verify OTP
    const result = await verifyOTP(user.id, code);

    if (!result.success) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CODE',
          message: result.error || 'Invalid verification code',
        },
      });
    }

    // Mark email as verified
    await db.query(
      'UPDATE users SET email_verified_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Sign JWT token
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
 * POST /auth/resend-otp
 * Resend verification OTP
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

    // Find user by username or email
    const identifierLower = emailOrUsername.toLowerCase();
    const [users] = await db.query(
      `SELECT id, email, email_verified_at
       FROM users
       WHERE username_lower = ? OR email_lower = ?
       LIMIT 1`,
      [identifierLower, identifierLower]
    );

    // Don't leak whether user exists - always return 200
    if (users.length === 0) {
      return res.status(200).json({ ok: true });
    }

    const user = users[0];

    // If already verified, reject
    if (user.email_verified_at) {
      return res.status(409).json({
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email already verified',
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

    // Generate new OTP
    const { code } = await createOTP(user.id);

    // Send email
    await sendVerificationEmail(user.email, code);

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

module.exports = router;
