import { CRYPTO_CONFIG } from '../utils/constants';
import { stringToArrayBuffer, base64ToArrayBuffer } from './encoding';

// Derive AES key dari password (untuk encrypt private key)
export async function deriveKeyFromPassword(password, salt) {
  let saltBuffer;
  try {
    // Coba parse sebagai base64 (format baru dengan random bytes)
    saltBuffer = base64ToArrayBuffer(salt);
  } catch (e) {
    // Fallback ke string biasa (format lama menggunakan email)
    saltBuffer = stringToArrayBuffer(salt);
  }

  // Import password sebagai key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES key
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS,
      hash: CRYPTO_CONFIG.PBKDF2_HASH
    },
    keyMaterial,
    {
      name: CRYPTO_CONFIG.AES_ALGORITHM,
      length: CRYPTO_CONFIG.AES_KEY_LENGTH
    },
    false, // not extractable untuk security
    ['encrypt', 'decrypt']
  );
}