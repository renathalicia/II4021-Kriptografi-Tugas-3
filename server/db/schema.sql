-- ============================================================================
-- DATABASE SCHEMA
-- ============================================================================
-- Schema untuk SQLite atau PostgreSQL
-- Akan diimplementasi sepenuhnya di task 2 (Setup Database & Skema)

-- USERS TABLE
-- Menyimpan informasi user, public key, dan encrypted private key
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  salt TEXT NOT NULL,
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  kdf_params TEXT,                    -- JSON metadata untuk KDF
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- MESSAGES TABLE
-- Menyimpan pesan terenkripsi antara users
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_email TEXT NOT NULL,
  receiver_email TEXT NOT NULL,
  ciphertext TEXT NOT NULL,           -- AES-encrypted message
  iv TEXT NOT NULL,                   -- Initialization vector untuk AES
  mac TEXT,                           -- HMAC untuk bonus (optional)
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- INDEX untuk query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_email);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_email);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_email, receiver_email);
