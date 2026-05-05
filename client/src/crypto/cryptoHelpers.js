/**
 * Web Crypto API Helper Functions
 * Location: client/src/crypto/cryptoHelpers.js
 */

// ============================================
// 1. ECDH KEY GENERATION & EXCHANGE
// ============================================

export async function generateECDHKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256" // atau P-384, P-521
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(exported);
}

export async function exportPrivateKey(privateKey) {
  const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(exported);
}

export async function importPublicKey(base64Key) {
  const keyData = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "spki",
    keyData,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

export async function importPrivateKey(base64Key) {
  const keyData = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
}

export async function computeSharedSecret(privateKey, publicKey) {
  return await window.crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256
  );
}

// ============================================
// 2. KEY DERIVATION (HKDF & PBKDF2)
// ============================================

export async function deriveAESKeyFromSharedSecret(sharedSecret, salt = "", info = "chat-encryption") {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    sharedSecret,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      info: new TextEncoder().encode(info)
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function deriveKeyFromPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ============================================
// 3. AES ENCRYPTION & DECRYPTION
// ============================================

export async function encryptAES(plaintext, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv)
  };
}

export async function decryptAES(ciphertextBase64, ivBase64, key) {
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);
  const iv = base64ToArrayBuffer(ivBase64);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ============================================
// 4. MAC (BONUS)
// ============================================

export async function computeMAC(message, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await window.crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64(hash);
}

export async function verifyMAC(message, receivedMAC, key) {
  const computedMAC = await computeMAC(message, key);
  return computedMAC === receivedMAC;
}

// ============================================
// 5. UTILITY FUNCTIONS
// ============================================

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function exportAESKey(key) {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

export async function importAESKey(base64Key) {
  const keyData = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}
