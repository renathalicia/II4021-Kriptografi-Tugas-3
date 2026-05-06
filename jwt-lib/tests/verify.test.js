'use strict';

const crypto = require('crypto');
const { sign }   = require('../sign');
const { verify } = require('../verify');

function generateKeyPair(curve) {
  return crypto.generateKeyPairSync('ec', {
    namedCurve: curve,
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

const kp256 = generateKeyPair('prime256v1');
const kp384 = generateKeyPair('secp384r1');
const kp521 = generateKeyPair('secp521r1');
const kpOther = generateKeyPair('prime256v1');

const H256 = { alg: 'ES256', typ: 'JWT' };
const H384 = { alg: 'ES384', typ: 'JWT' };
const H512 = { alg: 'ES512', typ: 'JWT' };

const now = Math.floor(Date.now() / 1000);

// ==================== Happy Path ====================

describe('verify – happy path', () => {
  test('verify JWT ES256 yang valid', () => {
    const token = sign(H256, { iss: 'srv', sub: 'u1' }, {}, kp256.privateKey);
    const result = verify(token, kp256.publicKey);
    expect(result.header.alg).toBe('ES256');
    expect(result.payload.iss).toBe('srv');
    expect(result.payload.sub).toBe('u1');
  });

  test('verify JWT ES384 yang valid', () => {
    const token = sign(H384, {}, { data: 'hello' }, kp384.privateKey);
    const result = verify(token, kp384.publicKey);
    expect(result.payload.data).toBe('hello');
  });

  test('verify JWT ES512 yang valid', () => {
    const token = sign(H512, {}, {}, kp521.privateKey);
    expect(() => verify(token, kp521.publicKey)).not.toThrow();
  });

  test('verify token dengan exp di masa depan', () => {
    const token = sign(H256, { exp: now + 3600 }, {}, kp256.privateKey);
    const result = verify(token, kp256.publicKey);
    expect(result.payload.exp).toBe(now + 3600);
  });

  test('verify token dengan nbf di masa lalu', () => {
    const token = sign(H256, { nbf: now - 60 }, {}, kp256.privateKey);
    expect(() => verify(token, kp256.publicKey)).not.toThrow();
  });

  test('ignoreExp=true bypass exp validation ketika sudah expired', () => {
    const token = sign(H256, { exp: now - 1 }, {}, kp256.privateKey);
    expect(() => verify(token, kp256.publicKey, { ignoreExp: true })).not.toThrow();
  });

  test('ignoreNbf=true bypass nbf validation ketika belum berlaku', () => {
    const token = sign(H256, { nbf: now + 9999 }, {}, kp256.privateKey);
    expect(() => verify(token, kp256.publicKey, { ignoreNbf: true })).not.toThrow();
  });

  test('return object { header, payload, signature }', () => {
    const token = sign(H256, {}, { foo: 'bar' }, kp256.privateKey);
    const result = verify(token, kp256.publicKey);
    expect(result).toHaveProperty('header');
    expect(result).toHaveProperty('payload');
    expect(result).toHaveProperty('signature');
    expect(result.payload.foo).toBe('bar');
  });

  test('validate iss, sub, aud, jti yang cocok berhasil', () => {
    const claims = { iss: 'issuer', sub: 'subject', aud: 'audience', jti: 'token-id-1' };
    const token = sign(H256, claims, {}, kp256.privateKey);
    expect(() =>
      verify(token, kp256.publicKey, {
        iss: 'issuer', sub: 'subject', aud: 'audience', jti: 'token-id-1',
      })
    ).not.toThrow();
  });
});

// ==================== Edge Cases ====================

describe('verify – edge cases', () => {
  test('throw error dengan public key yang salah', () => {
    const token = sign(H256, {}, {}, kp256.privateKey);
    expect(() => verify(token, kpOther.publicKey)).toThrow(/tidak valid/i);
  });

  test('throw error jika payload dimanipulasi', () => {
    const token = sign(H256, { sub: 'user1' }, {}, kp256.privateKey);
    const [h, , sig] = token.split('.');
    const fakePayload = Buffer.from(JSON.stringify({ sub: 'hacker' })).toString('base64url');
    const tampered = `${h}.${fakePayload}.${sig}`;
    expect(() => verify(tampered, kp256.publicKey)).toThrow();
  });

  test('throw error jika JWT hanya 2 bagian', () => {
    expect(() => verify('header.payload', kp256.publicKey)).toThrow(/3 bagian/i);
  });

  test('throw error jika JWT bukan string', () => {
    expect(() => verify(12345, kp256.publicKey)).toThrow(/string/i);
  });

  test('throw error jika header bukan base64url valid', () => {
    expect(() => verify('!!!.payload.sig', kp256.publicKey)).toThrow();
  });

  test('throw error jika token kedaluwarsa (exp)', () => {
    const token = sign(H256, { exp: now - 10 }, {}, kp256.privateKey);
    expect(() => verify(token, kp256.publicKey)).toThrow(/kedaluwarsa/i);
  });

  test('throw error jika token belum berlaku (nbf)', () => {
    const token = sign(H256, { nbf: now + 9999 }, {}, kp256.privateKey);
    expect(() => verify(token, kp256.publicKey)).toThrow(/belum berlaku/i);
  });

  test('throw error jika iss tidak cocok', () => {
    const token = sign(H256, { iss: 'srv' }, {}, kp256.privateKey);
    expect(() => verify(token, kp256.publicKey, { iss: 'other' })).toThrow(/issuer/i);
  });

  test('throw error jika aud tidak cocok', () => {
    const token = sign(H256, { aud: 'app1' }, {}, kp256.privateKey);
    expect(() => verify(token, kp256.publicKey, { aud: 'app2' })).toThrow(/audience/i);
  });

  test('throw error jika algoritma tidak ada dalam allowedAlgs', () => {
    const token = sign(H256, {}, {}, kp256.privateKey);
    expect(() => verify(token, kp256.publicKey, { algs: ['ES512'] })).toThrow(/tidak diizinkan/i);
  });

  test('throw error jika panjang tanda-tangan salah (byte dibuang)', () => {
    const token = sign(H256, {}, {}, kp256.privateKey);
    const [h, p, sig] = token.split('.');
    const truncated = `${h}.${p}.${sig.slice(0, -4)}`;
    expect(() => verify(truncated, kp256.publicKey)).toThrow();
  });
});