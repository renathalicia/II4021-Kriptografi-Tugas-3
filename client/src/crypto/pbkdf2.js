import { CRYPTO_CONFIG } from '../utils/constants';
import { stringToArrayBuffer } from './encoding';

// Derive AES key dari password (untuk encrypt private key)
export async function deriveKeyFromPassword(password, salt) {
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
      salt: stringToArrayBuffer(salt),
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