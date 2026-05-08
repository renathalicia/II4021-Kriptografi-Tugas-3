// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Crypto Configuration
export const CRYPTO_CONFIG = {
  // ECDH
  ECDH_CURVE: 'P-256',
  
  // PBKDF2
  PBKDF2_ITERATIONS: 100000,
  PBKDF2_HASH: 'SHA-256',
  
  // HKDF
  HKDF_HASH: 'SHA-256',
  HKDF_INFO: 'chat-encryption',
  
  // AES
  AES_ALGORITHM: 'AES-GCM',
  AES_KEY_LENGTH: 256,
  AES_IV_LENGTH: 12, // 12 bytes untuk GCM
  
  // HMAC
  HMAC_HASH: 'SHA-256'
};

// JWT Cookie Configuration
export const JWT_COOKIE_NAME = 'jwt';
export const JWT_MAX_AGE = 86400; // 24 hours

// Polling Configuration
export const POLLING_INTERVAL = 2000; // 2 seconds

// Session Storage Keys
export const STORAGE_KEYS = {
  PRIVATE_KEY: 'privateKey',
  PUBLIC_KEY: 'publicKey',
  EMAIL: 'email'
};