const express = require('express');
const router = express.Router();
const { hashPassword, verifyPassword } = require('../utils/password');
const { createUser, findUserByEmail } = require('../models/user');
const { sign } = require('../../jwt-lib');
const fs = require('fs');
const path = require('path');

// ============================================================================
// POST /register — Registrasi user baru
// ============================================================================
// Menerima: { email, password, public_key, encrypted_private_key, kdf_params }
// Langkah:
//   1. Validasi semua required fields ada
//   2. Cek apakah email sudah terdaftar → 409
//   3. Hash password menggunakan bcrypt
//   4. Simpan semua data ke tabel USERS
//   5. Return 201 jika berhasil
// CATATAN: kdf_params disimpan apa adanya (opaque) — hanya diteruskan kembali
//          saat login untuk digunakan client mendekripsi private key.

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, public_key, encrypted_private_key, kdf_params } = req.body;

    // ---- 1. Validasi input ----
    if (!email || !password || !public_key || !encrypted_private_key || !kdf_params) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Field email, password, public_key, encrypted_private_key, dan kdf_params wajib diisi',
        timestamp: new Date().toISOString()
      });
    }

    // ---- 2. Cek email sudah terdaftar ----
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email sudah terdaftar',
        timestamp: new Date().toISOString()
      });
    }

    // ---- 3. Hash password ----
    const { hash, salt } = await hashPassword(password);

    // ---- 4. Simpan user ke database ----
    const newUser = await createUser({
      email,
      hashed_password: hash,
      salt,
      public_key,
      encrypted_private_key,
      kdf_params
    });

    // ---- 5. Return 201 ----
    return res.status(201).json({
      message: 'Registrasi berhasil',
      data: {
        email: newUser.email
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /login — Login user (placeholder, belum diimplementasi)
// ============================================================================

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Field email dan password wajib diisi',
        timestamp: new Date().toISOString()
      });
    }

    // 1. Cari user berdasarkan email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User tidak ditemukan',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Verifikasi password
    const isValid = await verifyPassword(password, user.hashed_password);
    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Password salah',
        timestamp: new Date().toISOString()
      });
    }

    // 3. Buat JWT menggunakan jwt-lib (A2)
    const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH
      ? path.resolve(process.cwd(), process.env.JWT_PRIVATE_KEY_PATH)
      : path.join(__dirname, '../../keys/ec_private.pem');

    if (!fs.existsSync(privateKeyPath)) {
      throw new Error(`Private key tidak ditemukan di path: ${privateKeyPath}`);
    }

    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    const header = { alg: 'ES256', typ: 'JWT' };
    const claims = {
      sub: email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 1 hari
    };

    const token = await sign(header, claims, {}, privateKey);

    // 4. Simpan JWT ke cookie httpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 hari
    });

    // 5. Return response
    let parsedKdfParams;
    try {
      parsedKdfParams = typeof user.kdf_params === 'string'
        ? JSON.parse(user.kdf_params)
        : user.kdf_params;
    } catch (err) {
      parsedKdfParams = user.kdf_params;
    }

    return res.status(200).json({
      message: 'Login berhasil',
      jwt: token,
      encryptedPrivateKey: user.encrypted_private_key,
      privateKeyIV: parsedKdfParams.iv,
      salt: parsedKdfParams.salt,
      publicKey: user.public_key,
      data: {
        encrypted_private_key: user.encrypted_private_key,
        kdf_params: parsedKdfParams
      }
    });

  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /logout — Logout user (placeholder, belum diimplementasi)
// ============================================================================

router.post('/logout', (req, res) => {
  // Hapus cookie JWT
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });

  return res.status(200).json({
    message: 'Logout berhasil'
  });
});

module.exports = router;