const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Create mailer transport
 * In development, use console logger instead of real SMTP
 */
function createTransport() {
  if (config.NODE_ENV === 'development') {
    // Console logger for development
    return {
      sendMail: async (mailOptions) => {
        console.log('\n========== EMAIL (Development Mode) ==========');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Body:\n', mailOptions.text || mailOptions.html);
        console.log('=============================================\n');
        return { messageId: 'dev-' + Date.now() };
      },
    };
  }

  // Production SMTP transport
  return nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });
}

const transport = createTransport();

/**
 * Send verification code email
 * @param {string} to - Recipient email
 * @param {string} code - 6-digit OTP code
 */
async function sendVerificationEmail(to, code) {
  const subject = 'Your EngageSwap verification code';
  const text = `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${code}
      </div>
      <p>This code will expire in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  try {
    await transport.sendMail({
      from: config.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error('[Mailer] Failed to send email:', err.message);
    return false;
  }
}

/**
 * Send password reset code email
 * @param {string} to - Recipient email
 * @param {string} code - 6-digit OTP code
 */
async function sendPasswordResetEmail(to, code) {
  const subject = 'Reset your EngageSwap password';
  const text = `Your password reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email and your password will remain unchanged.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested to reset your EngageSwap password. Your verification code is:</p>
      <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${code}
      </div>
      <p>This code will expire in <strong>10 minutes</strong>.</p>
      <p><strong>If you didn't request a password reset</strong>, please ignore this email and your password will remain unchanged.</p>
      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        For security reasons, never share this code with anyone.
      </p>
    </div>
  `;

  try {
    await transport.sendMail({
      from: config.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error('[Mailer] Failed to send password reset email:', err.message);
    return false;
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
