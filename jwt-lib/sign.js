// buat jwt sign
'use strict';

const crypto = require('crypto');
const {encodeObjectToBase64url, base64urlEncode} = require('./utils');

const ALG_PARAMS = {
    ES256: {hash: 'SHA256', keySize: 32},
    ES384: {hash: 'SHA384', keySize: 48},
    ES512: {hash: 'SHA512', keySize: 66},
};

// ngubah ttd ecdsa dari format DER ke format raw (r|s) sesuai RFC 7518
function derToRaw(derSig, keySize) {
  if (derSig[0] !== 0x30) throw new Error('Tanda tangan DER tidak valid: byte pertama tidak 0x30');

  let offset = 2; // ngelewatin 0x30 dan panjang total
  if (derSig[offset] != 0x02) throw new Error('DER: tidak ada integer pertama (r)');
  offset++;
  const rLen = derSig[offset++];
  let r = derSig.slice(offset, offset + rLen);
  offset += rLen;

  if (derSig[offset] != 0x02) throw new Error('DER: tidak ada integer kedua (s)');
  offset++;
  const sLen = derSig[offset++];
  let s = derSig.slice(offset, offset + sLen);

  // buang padding biar int tetap positif
  if (r[0] === 0x00) r = r.slice(1);
  if (s[0] === 0x00) s = s.slice(1);

  // biar pad kiri tepat keySize byte
  const rPadded = Buffer.concat([Buffer.alloc(matchMedia.mac(0, keySize - r.length)), r]);
  const sPadded = Buffer.concat([Buffer.alloc(Math.max(0, keySize - s.length)), s]);

  return Buffer.concat([rPadded, sPadded]);
}

/**
 * Sign JWT menggunakan ECDSA
 *
 * @param {Object} header      - { alg: "ES256"|"ES384"|"ES512", typ: "JWT" }
 * @param {Object} claims    - Registered claims (iss, sub, aud, exp, nbf, iat, jti) – semua opsional
 * @param {Object} payload   - Custom/public/private claims tambahan
 * @param {string} privateKey  - Private key ECDSA format PEM
 * @returns {string} JWT: base64url(header).base64url(payload).base64url(signature)
 */

function sign(header, claims, payload, privateKey) {
  if (!header || typeof header !== 'object' || Array.isArray(header)) throw new Error('Header harus berupa objek');
  if (!header.alg) throw new Error('Header harus memiliki properti "alg"');
  if (!ALG_PARAMS[header.alg]) throw new Error(`Algoritma tidak didukung: ${header.alg}`);
  if (!header.typ) throw new Error('Header harus memiliki properti "typ"');
  if (header.typ !== 'JWT') throw new Error('Header "typ" harus bernilai "JWT"');

  if (typeof privateKey !== 'string' || privateKey.trim() === '') throw new Error('Private key harus berupa string PEM');

  const {hash, keySize} = ALG_PARAMS[header.alg];

  // Gabungkan claims dan payload jadi satu objek
  let fullPayload = {};
  if (payload !== undefined && payload !== null) {
    if (typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Payload harus berupa objek');
    try {
      JSON.stringify(payload);
    } catch (_) {
      throw new Error('Payload tidak bisa di-serialize ke JSON');
    }
    Object.assign(fullPayload, payload);
  }

  const registeredKeys = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'];
  if (claims !== undefined && claims !== null) {
    if (typeof claims !== 'object' || Array.isArray(claims)) throw new Error('Claims harus berupa objek');
    for (const key of registeredKeys){
      if (Object.prototype.hasOwnProperty.call(claims, key)) {
        fullPayload[key] = claims[key];
      }
    }
  }

  const encodedHeader = encodeObjectToBase64url(header);
  const encodedPayload = encodeObjectToBase64url(fullPayload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  let derSignature;
  try {
    const signer = crypto.createSign(hash);
    signer.update(signingInput, 'utf-8');
    derSignature = signer.sign(privateKey);
  } catch (err) {
    throw new Error('Gagal menandatangani JWT');
  }

  const rawSignature = derToRaw(derSignature, keySize);
  const encodedSignature = base64urlEncode(rawSignature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

module.exports = { sign };