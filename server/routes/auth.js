const express = require('express');
const router = express.Router();
const { hashPassword } = require('../utils/password');
const { createUser, findUserByEmail } = require('../models/user');

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

router.post('/login', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint /auth/login belum diimplementasi'
  });
});

// ============================================================================
// POST /logout — Logout user (placeholder, belum diimplementasi)
// ============================================================================

router.post('/logout', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint /auth/logout belum diimplementasi'
  });
});

module.exports = router;
