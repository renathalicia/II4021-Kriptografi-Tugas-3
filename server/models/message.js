// ============================================================================
// MESSAGE MODEL
// ============================================================================
// Placeholder untuk query-query terkait message
// Akan diimplementasi di task 7 (Endpoint Messages)

/**
 * Create new message
 * @param {Object} messageData - { sender_email, receiver_email, ciphertext, iv, mac }
 * @returns {Promise<Object>} - Created message
 */
async function createMessage(messageData) {
  // TODO: INSERT INTO messages VALUES (...)
  throw new Error('createMessage not implemented');
}

/**
 * Get messages between two users
 * @param {string} user1Email - First user email
 * @param {string} user2Email - Second user email
 * @returns {Promise<Array>} - List of messages
 */
async function getConversation(user1Email, user2Email) {
  // TODO: SELECT * FROM messages 
  //       WHERE (sender_email = ? AND receiver_email = ?) 
  //       OR (sender_email = ? AND receiver_email = ?)
  throw new Error('getConversation not implemented');
}

/**
 * Get all messages for a user
 * @param {string} email - User email
 * @returns {Promise<Array>} - List of messages
 */
async function getUserMessages(email) {
  // TODO: SELECT * FROM messages WHERE receiver_email = ?
  throw new Error('getUserMessages not implemented');
}

module.exports = {
  createMessage,
  getConversation,
  getUserMessages
};
