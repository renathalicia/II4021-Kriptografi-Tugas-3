require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

// DATABASE CONNECTION POOL
// PostgreSQL connection pool untuk Supabase

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const useSsl = process.env.PGSSLMODE === 'require' || process.env.PGSSLMODE === 'verify-full';

// Create connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 20,                      // Max connections
  idleTimeoutMillis: 30000,    // Idle timeout
  connectionTimeoutMillis: 2000 // Connection timeout
});

// CONNECTION POOL EVENTS

pool.on('error', (err) => {
  console.error('[DB POOL ERROR]', err);
});

pool.on('connect', () => {
  console.log('[DB] Connection established to PostgreSQL');
});

// QUERY FUNCTION

/**
 * Execute query dengan parameter binding (prevent SQL injection)
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query result rows
 */
async function query(queryText, params = []) {
  try {
    const result = await pool.query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('[DB QUERY ERROR]', {
      query: queryText,
      params,
      error: error.message
    });
    throw error;
  }
}

/**
 * Execute query dan return single row
 * @param {string} queryText - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} - First row or null
 */
async function queryOne(queryText, params = []) {
  const rows = await query(queryText, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute query tanpa return (INSERT, UPDATE, DELETE)
 * @param {string} queryText - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} - Number of affected rows
 */
async function execute(queryText, params = []) {
  try {
    const result = await pool.query(queryText, params);
    return result.rowCount;
  } catch (error) {
    console.error('[DB EXECUTE ERROR]', {
      query: queryText,
      params,
      error: error.message
    });
    throw error;
  }
}

// INITIALIZATION

/**
 * Initialize database connection
 * Test connection ke database
 */
async function initializeDatabase() {
  try {
    const result = await query('SELECT NOW()');
    console.log('[DB] ✓ Successfully connected to PostgreSQL');
    console.log('[DB] ✓ Current time:', result[0]);
    return true;
  } catch (error) {
    console.error('[DB] ✗ Failed to connect to PostgreSQL:', error.message);
    process.exit(1);
  }
}

/**
 * Close database connection (graceful shutdown)
 */
async function closeDatabase() {
  try {
    await pool.end();
    console.log('[DB] ✓ Database connection closed');
  } catch (error) {
    console.error('[DB] ✗ Error closing database:', error.message);
  }
}

// EXPORTS

module.exports = {
  pool,
  query,
  queryOne,
  execute,
  initializeDatabase,
  closeDatabase
};
