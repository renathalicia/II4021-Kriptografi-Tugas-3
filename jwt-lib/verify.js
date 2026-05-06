// untuk validasi jwt signature

'use strict';

const crypto = require('crypto');
const {decodeBase64urlToObject, base64urlDecode} = require('./utils');

const ALG_PARAMS = {
    ES256: {hash: 'SHA256', keySize: 32},
    ES384: {hash: 'SHA384', keySize: 48},
    ES512: {hash: 'SHA512', keySize: 66},
};

// ngubah ttd ecdsa dari format raw (r|s) ke format DER sesuai RFC 7518
function rawToDer(rawSig, keySize) {
    let r = rawSig.slice(0, keySize);
    let s = rawSig.slice(keySize);

    // nambah 0x0o didepan, biar int tetap positif
    if (r[0] & 0x80) r = Buffer.concat([Buffer.alloc(1, 0), r]);
    if (s[0] & 0x80) s = Buffer.concat([Buffer.alloc(1, 0), s]);

    const rLen = r.length;
    const sLen = s.length;
    const totalLen = 2 + rLen + 2 + sLen;

    const der = Buffer.alloc(2 + totalLen);
    let off = 0;
    der[off++] = 0x30;
    der[off++] = totalLen;
    der[off++] = 0x02;
    der[off++] = rLen;
    r.copy(der, off);
    off += rLen;
    der[off++] = 0x02;
    der[off++] = sLen;
    s.copy(der, off);

    return der;
}

/**
 * Memverifikasi JWT dan mengembalikan { header, payload, signature }.
 *
 * @param {string} jwt            - JWT string
 * @param {string} publicKey      - Public key ECDSA format PEM
 * @param {Object} [options]      - Opsi validasi (semua opsional):
 *   algs        {string[]}  - Daftar algoritma yang diizinkan
 *   iss         {string}    - Issuer yang diharapkan
 *   sub         {string}    - Subject yang diharapkan
 *   aud         {string}    - Audience yang diharapkan
 *   jti         {string}    - JWT ID yang diharapkan
 *   ignoreExp   {boolean}   - Lewati validasi exp jika true
 *   ignoreNbf   {boolean}   - Lewati validasi nbf jika true
 * @returns {{ header: Object, payload: Object, signature: string }}
 */
function verify(jwt, publicKey, options = {}) {
    if (typeof jwt !== 'string') throw new Error('JWT harus berupa string');

    const parts = jwt.split('.');
    if (parts.length !== 3) throw new Error('JWT harus terdiri dari 3 bagian yang dipisahkan oleh titik');

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // decode header
    let header;
    try{
        header = decodeBase64urlToObject(encodedHeader);
    } catch (e) {
        throw new Error('Header JWT tidak valid JSON');
    }

    // validasi header
    if (!header.alg) throw new Error('Header harus memiliki properti "alg"');
    if (!header.typ || header.typ !== 'JWT') throw new Error('Header "typ" harus bernilai "JWT"');

    // cek algo yang diizinkan
    const alllowedAlgs = options.algs || Object.keys(ALG_PARAMS);
    if (!alllowedAlgs.includes(header.alg)) throw new Error(`Algoritma tidak diizinkan: ${header.alg}`);
    if (!ALG_PARAMS[header.alg]) throw new Error(`Algoritma tidak didukung: ${header.alg}`);

    const {hash, keySize} = ALG_PARAMS[header.alg];

    // decode payload
    let payload;
    try {
        payload = decodeBase64urlToObject(encodedPayload);
    } catch (e) {
        throw new Error('Payload JWT tidak valid JSON');
    }

    // decode & verif ttd
    let rawSignature;
    try {
        rawSignature = base64urlDecode(encodedSignature);
    } catch (e) {
        throw new Error('Encoding ttd JWT tidak valid');
    }

    if (rawSignature.length !== 2 * keySize) throw new Error('Panjang ttd JWT tidak sesuai dengan algoritma yang digunakan');

    const derSignature = rawToDer(rawSignature, keySize);
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    let isValid;
    try {
        const verifier = crypto.createVerify(hash);
        verifier.update(signingInput, 'utf-8');
        isValid = verifier.verify(publicKey, derSignature);
    } catch (e) {
        throw new Error('Verifikasi ttd gagal');
    }

    if (!isValid) throw new Error('Ttd JWT tidak valid');

    // validasi claims (iss, sub, aud, jti)
    const now = Math.floor(Date.now() / 1000);

    if (!options.ignoreExp && payload.exp !== undefined) {
        if (typeof payload.exp !== 'number') throw new Error('Klaim "exp" harus berupa angka');
        if (now >= payload.exp) throw new Error('JWT telah kedaluwarsa (exp)');
    }

    if (!options.ignoreNbf && payload.nbf !== undefined) {
        if (typeof payload.nbf !== 'number') throw new Error('Klaim "nbf" harus berupa angka');
        if (now < payload.nbf) throw new Error('JWT belum berlaku (nbf)');
    }

    if (options.iss !== undefined && payload.iss !== options.iss) {
        throw new Error(`Issuer tidak cocok: diharapkan "${options.iss}", dapat "${payload.iss}"`);
    }
    if (options.sub !== undefined && payload.sub !== options.sub) {
        throw new Error(`Subject tidak cocok: diharapkan "${options.sub}", dapat "${payload.sub}"`);
    }
    if (options.aud !== undefined && payload.aud !== options.aud) {
        throw new Error(`Audience tidak cocok: diharapkan "${options.aud}", dapat "${payload.aud}"`);
    }
    if (options.jti !== undefined && payload.jti !== options.jti) {
        throw new Error(`JWT ID tidak cocok: diharapkan "${options.jti}", dapat "${payload.jti}"`);
    }

    return { header, payload, signature: encodedSignature };
}

module.exports = { verify };