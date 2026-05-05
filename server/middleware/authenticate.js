// ============================================================================
// PLACEHOLDER: AUTHENTICATION MIDDLEWARE
// ============================================================================
// Akan diimplementasi di task 5-6 (setelah JWT setup)

/**
 * Middleware untuk verifikasi JWT token dari cookie atau Authorization header
 * Akan digunakan untuk protect routes yang memerlukan autentikasi
 */
const authenticateToken = (req, res, next) => {
  // TODO: Implementasi verifikasi JWT
  // 1. Extract token dari req.cookies.token atau req.headers.authorization
  // 2. Verify menggunakan jwt-lib dari anggota 2
  // 3. Jika valid, set req.user = decoded token
  // 4. Jika invalid, return 401 Unauthorized
  next();
};

module.exports = {
  authenticateToken
};
