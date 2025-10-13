require('dotenv').config();

/**
 * Validate required environment variables
 */
function validateEnv() {
  const required = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'CORS_ORIGIN',
    'JWT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('[Config] Missing required environment variables:');
    missing.forEach((key) => console.error(`  - ${key}`));
    process.exit(1);
  }
}

/**
 * Load and export configuration
 */
function loadConfig() {
  validateEnv();

  return {
    PORT: parseInt(process.env.PORT, 10) || 5081,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB_HOST: process.env.DB_HOST,
    DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    CORS_ORIGIN: process.env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    JWT_SECRET: process.env.JWT_SECRET,
  };
}

module.exports = loadConfig();
