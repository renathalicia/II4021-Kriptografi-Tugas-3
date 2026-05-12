import { CRYPTO_CONFIG } from '../utils/constants';
import { arrayBufferToBase64, base64ToArrayBuffer } from './encoding';

//ECDH keypair untuk user
export async function generateECDHKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: CRYPTO_CONFIG.ECDH_CURVE
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}
export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToBase64(exported);
}
export async function exportPrivateKey(privateKey) {
  const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  return arrayBufferToBase64(exported);
}
export async function importPublicKey(base64Key) {
  const keyData = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'ECDH',
      namedCurve: CRYPTO_CONFIG.ECDH_CURVE
    },
    true,
    []
  );
}

export async function importPrivateKey(base64Key) {
  const keyData = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'ECDH',
      namedCurve: CRYPTO_CONFIG.ECDH_CURVE
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

export async function computeSharedSecret(privateKey, publicKey) {
  return await window.crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: publicKey
    },
    privateKey,
    256 // 256 bits
  );
}