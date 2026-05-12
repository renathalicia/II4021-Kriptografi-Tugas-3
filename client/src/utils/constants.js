export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

//konfigurasi alfo kripto (untuk di frontend)
export const CRYPTO_CONFIG = {
  ECDH_CURVE: 'P-256',
  
  PBKDF2_ITERATIONS: 100000,
  PBKDF2_HASH: 'SHA-256',
  
  HKDF_HASH: 'SHA-256',
  HKDF_INFO: 'chat-encryption',
  
  AES_ALGORITHM: 'AES-GCM',
  AES_KEY_LENGTH: 256,
  AES_IV_LENGTH: 12,
  
  HMAC_HASH: 'SHA-256' //BONUS
};

export const JWT_COOKIE_NAME = 'jwt';
export const JWT_MAX_AGE = 86400; 

export const POLLING_INTERVAL = 2000;

export const STORAGE_KEYS = {
  PRIVATE_KEY: 'privateKey',
  PUBLIC_KEY: 'publicKey',
  EMAIL: 'email'
};