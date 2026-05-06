import { CRYPTO_CONFIG } from '../utils/constants';
import { stringToArrayBuffer, arrayBufferToBase64 } from './encoding';

// Compute MAC dari message
export async function computeMAC(message, key) {
  const data = stringToArrayBuffer(message);
  
  // Untuk simplicity, kita pakai SHA-256 hash
  // Di production, sebaiknya pakai proper HMAC key derivation
  const hash = await window.crypto.subtle.digest(
    CRYPTO_CONFIG.HMAC_HASH,
    data
  );
  
  return arrayBufferToBase64(hash);
}

// Verify MAC
export async function verifyMAC(message, receivedMAC, key) {
  const computedMAC = await computeMAC(message, key);
  return computedMAC === receivedMAC;
}