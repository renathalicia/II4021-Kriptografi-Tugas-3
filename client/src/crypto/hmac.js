import { CRYPTO_CONFIG } from '../utils/constants';
import { stringToArrayBuffer, arrayBufferToBase64 } from './encoding';

// BONUS: cek integritas pesan dengan MAC (HMAC)
export async function computeMAC(message, key) {
  const data = stringToArrayBuffer(message);
  
  const hash = await window.crypto.subtle.digest(
    CRYPTO_CONFIG.HMAC_HASH,
    data
  );
  
  return arrayBufferToBase64(hash);
}

export async function verifyMAC(message, receivedMAC, key) {
  const computedMAC = await computeMAC(message, key);
  return computedMAC === receivedMAC;
}