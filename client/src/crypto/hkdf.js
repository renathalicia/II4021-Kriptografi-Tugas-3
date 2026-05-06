import { CRYPTO_CONFIG } from '../utils/constants';
import { stringToArrayBuffer } from './encoding';

// Derive AES key dari ECDH shared secret
export async function deriveAESKeyFromSharedSecret(sharedSecret, salt = '', info = CRYPTO_CONFIG.HKDF_INFO) {
  // Import shared secret sebagai key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // Derive AES key menggunakan HKDF
  return await window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: CRYPTO_CONFIG.HKDF_HASH,
      salt: stringToArrayBuffer(salt),
      info: stringToArrayBuffer(info)
    },
    keyMaterial,
    {
      name: CRYPTO_CONFIG.AES_ALGORITHM,
      length: CRYPTO_CONFIG.AES_KEY_LENGTH
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

// Export AES key untuk storage (jika perlu)
export async function exportAESKey(key) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

// Import AES key dari storage
export async function importAESKey(base64Key) {
  const keyData = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: CRYPTO_CONFIG.AES_ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
}

import { arrayBufferToBase64, base64ToArrayBuffer } from './encoding';