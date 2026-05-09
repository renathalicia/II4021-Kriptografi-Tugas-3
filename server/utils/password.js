const bcrypt = require('bcryptjs');

// ============================================================================
// PASSWORD HASHING & VERIFICATION
// ============================================================================
// Implementasi utility untuk secure password handling
// Sesuai spesifikasi poin B.1-2: Password tidak boleh disimpan plaintext

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

/**
 * Hash password menggunakan bcrypt
 * @param {string} password - Password plaintext
 * @returns {Promise<{hash: string, salt: string}>} - Hashed password dan salt
 */
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return {
      hash,
      salt
    };
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
}

/**
 * Verify password terhadap hash yang tersimpan
 * @param {string} password - Password plaintext yang akan diverifikasi
 * @param {string} hash - Hashed password yang tersimpan di database
 * @returns {Promise<boolean>} - True jika password valid, false jika tidak
 */
async function verifyPassword(password, hash) {
  try {
    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  } catch (error) {
    throw new Error(`Password verification failed: ${error.message}`);
  }
}

module.exports = {
  hashPassword,
  verifyPassword
};
