// ============================================================================
// USER MODEL
// ============================================================================
// Query-query terkait user untuk PostgreSQL (Supabase)

const { query, queryOne } = require('../db/db');

/**
 * Create new user
 * @param {Object} userData - { email, hashed_password, salt, public_key, encrypted_private_key, kdf_params }
 * @returns {Promise<Object>} - Created user (email only)
 */
async function createUser(userData) {
  const { email, hashed_password, salt, public_key, encrypted_private_key, kdf_params } = userData;

  const sql = `
    INSERT INTO users (email, hashed_password, salt, public_key, encrypted_private_key, kdf_params)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, created_at
  `;

  const rows = await query(sql, [
    email,
    hashed_password,
    salt,
    public_key,
    encrypted_private_key,
    JSON.stringify(kdf_params)
  ]);

  return rows[0];
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} - User object atau null jika tidak ditemukan
 */
async function findUserByEmail(email) {
  const sql = `SELECT * FROM users WHERE email = $1`;
  return await queryOne(sql, [email]);
}

/**
 * Get all users (untuk contact list)
 * @param {string} excludeEmail - Email to exclude (current user)
 * @returns {Promise<Array>} - List of user emails
 */
async function getAllUsers(excludeEmail) {
  const sql = `SELECT email FROM users WHERE email != $1 ORDER BY email ASC`;
  return await query(sql, [excludeEmail]);
}

/**
 * Get user public key
 * @param {string} email - User email
 * @returns {Promise<Object|null>} - { email, public_key } atau null
 */
async function getUserPublicKey(email) {
  const sql = `SELECT email, public_key FROM users WHERE email = $1`;
  return await queryOne(sql, [email]);
}

module.exports = {
  createUser,
  findUserByEmail,
  getAllUsers,
  getUserPublicKey
};
