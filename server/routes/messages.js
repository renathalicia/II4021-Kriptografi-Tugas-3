const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/authenticate');
const { createMessage, getConversation } = require('../models/message');

// ============================================================================
// MESSAGES ROUTES
// ============================================================================

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const user1Email = req.user.sub;
    const user2Email = req.query.with;
    const afterId = req.query.afterId;

    if (!user2Email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter "with" diperlukan untuk menentukan lawan bicara'
      });
    }

    const messages = await getConversation(user1Email, user2Email, afterId);

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const sender_email = req.user.sub; // Ambil sender dari token autentikasi
    const { receiver_email, ciphertext, iv, mac } = req.body;

    if (!receiver_email || !ciphertext || !iv) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'receiver_email, ciphertext, dan iv wajib diisi'
      });
    }

    // Simpan pesan ke database secara "buta"
    const newMessage = await createMessage({
      sender_email,
      receiver_email,
      ciphertext,
      iv,
      mac
    });

    res.status(201).json({
      message: 'Pesan berhasil disimpan',
      data: newMessage
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
