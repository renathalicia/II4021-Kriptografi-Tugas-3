const express = require('express');
const router = express.Router();

// ============================================================================
// PLACEHOLDER: AUTH ROUTES
// ============================================================================
// Akan diimplementasi di task 5 (Endpoint Autentikasi)

router.post('/register', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint /auth/register belum diimplementasi'
  });
});

router.post('/login', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint /auth/login belum diimplementasi'
  });
});

router.post('/logout', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint /auth/logout belum diimplementasi'
  });
});

module.exports = router;
