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

    // Insert user (unverified)
    const [result] = await db.query(
      `INSERT INTO users (username, username_lower, email, email_lower, password_hash, coins, is_admin, email_verified_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, NULL)`,
      [username, usernameLower, email, emailLower, passwordHash]
    );

    const userId = result.insertId;

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
      `SELECT id, username, email, password_hash, is_admin, coins, email_verified_at
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
