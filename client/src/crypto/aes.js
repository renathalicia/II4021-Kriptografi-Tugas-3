import { CRYPTO_CONFIG } from '../utils/constants';
import { stringToArrayBuffer, arrayBufferToString, arrayBufferToBase64, base64ToArrayBuffer } from './encoding';

// Encrypt plaintext dengan AES-256-GCM
export async function encryptAES(plaintext, key) {
  const data = stringToArrayBuffer(plaintext);
  
  // Generate random IV (12 bytes untuk GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.AES_IV_LENGTH));
  
  // Encrypt
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: CRYPTO_CONFIG.AES_ALGORITHM,
      iv: iv
    },
    key,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv)
  };
}

// Decrypt ciphertext dengan AES-256-GCM
export async function decryptAES(ciphertextBase64, ivBase64, key) {
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);
  const iv = base64ToArrayBuffer(ivBase64);

  // Decrypt
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: CRYPTO_CONFIG.AES_ALGORITHM,
      iv: iv
    },
    key,
    ciphertext
  );

  return arrayBufferToString(decrypted);
}