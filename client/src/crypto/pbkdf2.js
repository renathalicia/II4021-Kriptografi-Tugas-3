import { CRYPTO_CONFIG } from '../utils/constants';
import { stringToArrayBuffer, base64ToArrayBuffer } from './encoding';

export async function deriveKeyFromPassword(password, salt) {
  let saltBuffer;
  try {
    saltBuffer = base64ToArrayBuffer(salt);
  } catch (e) {
    saltBuffer = stringToArrayBuffer(salt);
  }

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );


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
    false,
    ['encrypt', 'decrypt']
  );
}