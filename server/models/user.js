// ============================================================================
// USER MODEL
// ============================================================================
// Placeholder untuk query-query terkait user
// Akan diimplementasi di task 5-6 (Endpoint Autentikasi & Users)

/**
 * Create new user
 * @param {Object} userData - { email, hashed_password, salt, public_key, encrypted_private_key, kdf_params }
 * @returns {Promise<Object>} - Created user
 */
async function createUser(userData) {
  // TODO: INSERT INTO users VALUES (...)
  throw new Error('createUser not implemented');
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} - User object atau null jika tidak ditemukan
 */
async function findUserByEmail(email) {
  // TODO: SELECT * FROM users WHERE email = ?
  throw new Error('findUserByEmail not implemented');
}

/**
 * Get all users (untuk contact list)
 * @returns {Promise<Array>} - List of all users
 */
async function getAllUsers() {
  // TODO: SELECT id, email, public_key FROM users
  throw new Error('getAllUsers not implemented');
}

/**
 * Get user public key
 * @param {string} email - User email
 * @returns {Promise<string|null>} - Public key atau null
 */
async function getUserPublicKey(email) {
  // TODO: SELECT public_key FROM users WHERE email = ?
  throw new Error('getUserPublicKey not implemented');
}

module.exports = {
  createUser,
  findUserByEmail,
  getAllUsers,
  getUserPublicKey
};
