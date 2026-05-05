const express = require('express');
const router = express.Router();

// ============================================================================
// PLACEHOLDER: USERS ROUTES
// ============================================================================
// Akan diimplementasi di task 6 (Endpoint Users)

router.get('/contacts', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint /users/contacts belum diimplementasi'
  });
});

router.get('/:email/pubkey', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint /users/:email/pubkey belum diimplementasi'
  });
});

module.exports = router;
