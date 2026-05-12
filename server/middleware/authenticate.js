const fs = require('fs');
const path = require('path');
const { verify } = require('../../jwt-lib');

/**
 * Middleware untuk verifikasi JWT token dari cookie atau Authorization header
 * Akan digunakan untuk protect routes yang memerlukan autentikasi
 */
const authenticateToken = (req, res, next) => {
  try {
    // 1. Extract token dari req.cookies.token atau req.headers.authorization
    let token = req.cookies && req.cookies.token;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Akses ditolak. Token tidak ditemukan.'
      });
    }

    // 2. Baca public key
    const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH 
      ? path.resolve(process.cwd(), process.env.JWT_PUBLIC_KEY_PATH)
      : path.join(__dirname, '../../keys/ec_public.pem');

    if (!fs.existsSync(publicKeyPath)) {
      throw new Error(`Public key tidak ditemukan di path: ${publicKeyPath}`);
    }
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

    // 3. Verify token menggunakan jwt-lib dari anggota 2
    const result = verify(token, publicKey);

    // 4. Jika valid, set req.user = decoded token payload
    req.user = result.payload;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token tidak valid atau sudah kedaluwarsa',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  authenticateToken
};
