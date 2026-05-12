import { CRYPTO_CONFIG } from '../utils/constants';
import { stringToArrayBuffer } from './encoding';
import { arrayBufferToBase64, base64ToArrayBuffer } from './encoding';
export async function deriveAESKeyFromSharedSecret(sharedSecret, salt = '', info = CRYPTO_CONFIG.HKDF_INFO) {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

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
    true, 
    ['encrypt', 'decrypt']
  );
}

export async function exportAESKey(key) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

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