const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Create mailer transport
 * Always use real SMTP for sending emails
 */
function createTransport() {
  // Real SMTP transport (works in both development and production)
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  // Log emails in development for debugging
  if (config.NODE_ENV === 'development') {
    console.log('[Mailer] Using real SMTP in development mode');
    console.log('[Mailer] SMTP Host:', config.SMTP_HOST);
    console.log('[Mailer] SMTP Port:', config.SMTP_PORT);
    console.log('[Mailer] SMTP User:', config.SMTP_USER);
  }

  return transporter;
}

const transport = createTransport();

/**
 * Send verification code email
 * @param {string} to - Recipient email
 * @param {string} code - 6-digit OTP code
 */
async function sendVerificationEmail(to, code) {
  const subject = 'Verify Your EngageSwap Account';
  const text = `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

              <!-- Header with Logo and Brand -->
              <tr>
                <td style="background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                    <span style="color: #ffffff;">Engage</span><span style="color: #d1fae5;">Swap</span>
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">Connecting Creators with Engaged Audiences</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 40px 20px 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                    Verify Your Email Address
                  </h2>
                  <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Thank you for signing up with EngageSwap! To complete your registration, please use the verification code below:
                  </p>
                </td>
              </tr>

              <!-- OTP Code Box -->
              <tr>
                <td style="padding: 0 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); border: 2px dashed #14b8a6; border-radius: 12px; padding: 30px;">
                        <p style="margin: 0 0 15px 0; color: #0f766e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                        <div style="font-size: 48px; font-weight: bold; color: #0d9488; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                          ${code}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Instructions -->
              <tr>
                <td style="padding: 30px 40px 20px 40px;">
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      ⏱️ <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>. Please verify your email as soon as possible.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Security Notice -->
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    If you didn't create an account with EngageSwap, you can safely ignore this email.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                    🔒 For security reasons, never share this verification code with anyone. EngageSwap will never ask you for this code.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                    Need help? Contact us at <a href="mailto:support@engageswap.in" style="color: #14b8a6; text-decoration: none;">support@engageswap.in</a>
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} EngageSwap. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const info = await transport.sendMail({
      from: config.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log('[Mailer] Verification email sent successfully to:', to);
    console.log('[Mailer] Message ID:', info.messageId);
    return true;
  } catch (err) {
    console.error('[Mailer] Failed to send verification email:', err.message);
    console.error('[Mailer] Error details:', err);
    return false;
  }
}

/**
 * Send password reset code email
 * @param {string} to - Recipient email
 * @param {string} code - 6-digit OTP code
 */
async function sendPasswordResetEmail(to, code) {
  const subject = 'Reset Your EngageSwap Password';
  const text = `Your password reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email and your password will remain unchanged.`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

              <!-- Header with Logo and Brand -->
              <tr>
                <td style="background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                    <span style="color: #ffffff;">Engage</span><span style="color: #d1fae5;">Swap</span>
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">Connecting Creators with Engaged Audiences</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 40px 20px 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                    Password Reset Request
                  </h2>
                  <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your EngageSwap password. Use the verification code below to proceed:
                  </p>
                </td>
              </tr>

              <!-- OTP Code Box -->
              <tr>
                <td style="padding: 0 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px dashed #f59e0b; border-radius: 12px; padding: 30px;">
                        <p style="margin: 0 0 15px 0; color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                        <div style="font-size: 48px; font-weight: bold; color: #d97706; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                          ${code}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Instructions -->
              <tr>
                <td style="padding: 30px 40px 20px 40px;">
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      ⏱️ <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>. Complete the password reset process promptly.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Security Warning -->
              <tr>
                <td style="padding: 20px 40px;">
                  <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                      ⚠️ <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged and secure.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Security Notice -->
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                    🔒 For security reasons, never share this verification code with anyone. EngageSwap will never ask you for this code via phone or email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                    Need help? Contact us at <a href="mailto:support@engageswap.in" style="color: #14b8a6; text-decoration: none;">support@engageswap.in</a>
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} EngageSwap. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const info = await transport.sendMail({
      from: config.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log('[Mailer] Password reset email sent successfully to:', to);
    console.log('[Mailer] Message ID:', info.messageId);
    return true;
  } catch (err) {
    console.error('[Mailer] Failed to send password reset email:', err.message);
    console.error('[Mailer] Error details:', err);
    return false;
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
