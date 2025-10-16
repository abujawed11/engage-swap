/**
 * Seed Admin User Script
 * Creates the admin user with credentials:
 * Username: admin
 * Password: admin123
 *
 * Run with: node scripts/seedAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');
const config = require('../src/config');
const { generatePublicId } = require('../src/utils/publicId');

async function seedAdmin() {
  try {
    console.log('🔧 Seeding admin user...');

    // Initialize database pool
    console.log('[Seed] Initializing database connection...');
    db.createPool(config);

    // Test database connectivity
    const dbUp = await db.pingDatabase();
    if (!dbUp) {
      throw new Error('Database connection failed');
    }
    console.log('[Seed] ✓ Database connected');

    const username = 'admin';
    const email = 'admin@engageswap.com';
    const password = 'admin123';

    // Check if admin user already exists
    const [existing] = await db.query(
      'SELECT id, username FROM users WHERE username_lower = ?',
      [username.toLowerCase()]
    );

    if (existing.length > 0) {
      console.log('✅ Admin user already exists:', existing[0].username);

      // Update is_admin flag if needed
      await db.query(
        'UPDATE users SET is_admin = 1 WHERE id = ?',
        [existing[0].id]
      );

      console.log('✅ Admin flag ensured for user:', existing[0].username);
      process.exit(0);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert admin user
    const [result] = await db.query(
      `INSERT INTO users (username, username_lower, email, email_lower, password_hash, coins, is_admin, email_verified_at)
       VALUES (?, ?, ?, ?, ?, 0, 1, NOW())`,
      [
        username,
        username.toLowerCase(),
        email,
        email.toLowerCase(),
        passwordHash,
      ]
    );

    const adminId = result.insertId;

    // Generate and set public_id
    const publicId = generatePublicId('USR', adminId);
    await db.query('UPDATE users SET public_id = ? WHERE id = ?', [publicId, adminId]);

    console.log('✅ Admin user created successfully!');
    console.log('📋 Credentials:');
    console.log('   Username:', username);
    console.log('   Password:', password);
    console.log('   Email:', email);
    console.log('   Public ID:', publicId);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the admin password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
