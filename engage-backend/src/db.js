const mysql = require('mysql2/promise');

let pool = null;

/**
 * Initialize MySQL connection pool
 */
function createPool(config) {
  pool = mysql.createPool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}

/**
 * Test database connectivity
 */
async function pingDatabase() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('[DB] Ping failed:', err.message);
    return false;
  }
}

/**
 * Execute a query on the pool
 */
async function query(sql, params) {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool.query(sql, params);
}

/**
 * Get the pool instance
 */
function getPool() {
  return pool;
}

module.exports = {
  createPool,
  pingDatabase,
  query,
  getPool,
};
