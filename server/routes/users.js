const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/authenticate');
const { getAllUsers, getUserPublicKey } = require('../models/user');

// ============================================================================
// USERS ROUTES
// ============================================================================

router.get('/contacts', authenticateToken, async (req, res, next) => {
  try {
    const currentUserEmail = req.user.sub;
    const users = await getAllUsers(currentUserEmail);
    
    // Format agar hanya mengembalikan array of string (email)
    const contacts = users.map(u => u.email);
    
    res.status(200).json({ contacts });
  } catch (error) {
    next(error);
  }
});

router.get('/:email/pubkey', authenticateToken, async (req, res, next) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Bad Request', message: 'Parameter email diperlukan' });
    }

    const user = await getUserPublicKey(email);
    
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User tidak ditemukan' });
    }

    res.status(200).json({
      public_key: user.public_key
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
