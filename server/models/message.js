// ============================================================================
// MESSAGE MODEL
// ============================================================================
// Placeholder untuk query-query terkait message
// Akan diimplementasi di task 7 (Endpoint Messages)

const { query } = require('../db/db');

/**
 * Create new message
 * @param {Object} messageData - { sender_email, receiver_email, ciphertext, iv, mac }
 * @returns {Promise<Object>} - Created message
 */
async function createMessage(messageData) {
  const { sender_email, receiver_email, ciphertext, iv, mac } = messageData;
  const sql = `
    INSERT INTO messages (sender_email, receiver_email, ciphertext, iv, mac)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const rows = await query(sql, [sender_email, receiver_email, ciphertext, iv, mac]);
  return rows[0];
}

/**
 * Get messages between two users
 * @param {string} user1Email - First user email
 * @param {string} user2Email - Second user email
 * @param {number|string} [afterId] - Optional ID filter
 * @returns {Promise<Array>} - List of messages
 */
async function getConversation(user1Email, user2Email, afterId) {
  let sql = `
    SELECT * FROM messages 
    WHERE ((sender_email = $1 AND receiver_email = $2) 
       OR  (sender_email = $2 AND receiver_email = $1))
  `;
  const params = [user1Email, user2Email];
  
  if (afterId && !isNaN(parseInt(afterId))) {
    sql += ` AND id > $3`;
    params.push(parseInt(afterId));
  }
  
  sql += ` ORDER BY timestamp ASC`;
  
  return await query(sql, params);
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
