-- ============================================================================
-- DATABASE SCHEMA (PostgreSQL)
-- ============================================================================
-- Schema untuk Supabase / PostgreSQL
-- Dijalankan sekali untuk inisialisasi database

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Menyimpan informasi user, public key, dan encrypted private key
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  kdf_params JSONB,                    -- JSON metadata untuk KDF
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
-- Menyimpan pesan terenkripsi antara users
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_email VARCHAR(255) NOT NULL,
  receiver_email VARCHAR(255) NOT NULL,
  ciphertext TEXT NOT NULL,           -- AES-encrypted message
  iv VARCHAR(255) NOT NULL,           -- Initialization vector untuk AES
  mac VARCHAR(255),                   -- HMAC untuk bonus (optional)
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES untuk query performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_email);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_email);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_email, receiver_email);