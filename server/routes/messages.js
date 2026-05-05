const express = require('express');
const router = express.Router();

// ============================================================================
// PLACEHOLDER: MESSAGES ROUTES
// ============================================================================
// Akan diimplementasi di task 7 (Endpoint Messages)

router.get('/', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint GET /messages belum diimplementasi'
  });
});

router.post('/', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint POST /messages belum diimplementasi'
  });
});

module.exports = router;
