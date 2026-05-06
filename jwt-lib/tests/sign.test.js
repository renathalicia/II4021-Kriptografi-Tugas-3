'use strict';

const crypto = require('crypto');
const { sign } = require('../sign');

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

const H256 = { alg: 'ES256', typ: 'JWT' };
const H384 = { alg: 'ES384', typ: 'JWT' };
const H512 = { alg: 'ES512', typ: 'JWT' };

function decodeJwt(token) {
  const [h, p] = token.split('.');
  const decode = str => JSON.parse(Buffer.from(
    str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4),
    'base64'
  ).toString('utf8'));
  return { header: decode(h), payload: decode(p) };
}

// ==================== Happy Path ====================

describe('sign – happy path', () => {
  test('generate JWT 3 parts dengan ES256', () => {
    const token = sign(H256, {}, {}, kp256.privateKey);
    expect(token.split('.')).toHaveLength(3);
  });

  test('generate JWT 3 parts dengan ES384', () => {
    const token = sign(H384, {}, {}, kp384.privateKey);
    expect(token.split('.')).toHaveLength(3);
  });

  test('generate JWT 3 parts dengan ES512', () => {
    const token = sign(H512, {}, {}, kp521.privateKey);
    expect(token.split('.')).toHaveLength(3);
  });

  test('registered claims tersimpan di payload', () => {
    const now = Math.floor(Date.now() / 1000);
    const claims = { iss: 'server', sub: 'user1', aud: 'app', iat: now, exp: now + 3600, jti: 'abc' };
    const token = sign(H256, claims, {}, kp256.privateKey);
    const { payload } = decodeJwt(token);
    expect(payload.iss).toBe('server');
    expect(payload.sub).toBe('user1');
    expect(payload.aud).toBe('app');
    expect(payload.exp).toBe(now + 3600);
    expect(payload.jti).toBe('abc');
  });

  test('custom payload fields tersimpan di payload', () => {
    const token = sign(H256, {}, { role: 'admin', userId: 42 }, kp256.privateKey);
    const { payload } = decodeJwt(token);
    expect(payload.role).toBe('admin');
    expect(payload.userId).toBe(42);
  });

  test('claims menimpa payload jika key sama', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = sign(H256, { iss: 'server', iat: now }, { iss: 'custom', foo: 'bar' }, kp256.privateKey);
    const { payload } = decodeJwt(token);
    expect(payload.iss).toBe('server');
    expect(payload.foo).toBe('bar');
  });

  test('header di-encode dengan benar', () => {
    const token = sign(H256, {}, {}, kp256.privateKey);
    const { header } = decodeJwt(token);
    expect(header.alg).toBe('ES256');
    expect(header.typ).toBe('JWT');
  });
});

// ==================== Edge Cases ====================

describe('sign – edge cases', () => {
  test('throw error jika header null', () => {
    expect(() => sign(null, {}, {}, kp256.privateKey)).toThrow();
  });

  test('throw error jika header.alg tidak ada', () => {
    expect(() => sign({ typ: 'JWT' }, {}, {}, kp256.privateKey)).toThrow(/alg/);
  });

  test('throw error jika header.typ tidak ada', () => {
    expect(() => sign({ alg: 'ES256' }, {}, {}, kp256.privateKey)).toThrow(/typ/);
  });

  test('throw error jika header.typ bukan "JWT"', () => {
    expect(() => sign({ alg: 'ES256', typ: 'JWE' }, {}, {}, kp256.privateKey)).toThrow(/JWT/);
  });

  test('throw error jika algoritma tidak didukung (HS256)', () => {
    expect(() => sign({ alg: 'HS256', typ: 'JWT' }, {}, {}, kp256.privateKey)).toThrow(/tidak didukung/i);
  });

  test('throw error jika privateKey bukan string', () => {
    expect(() => sign(H256, {}, {}, 12345)).toThrow(/PEM/i);
  });

  test('throw error jika privateKey adalah string kosong', () => {
    expect(() => sign(H256, {}, {}, '')).toThrow(/PEM/i);
  });

  test('throw error jika payload adalah array', () => {
    expect(() => sign(H256, {}, ['a', 'b'], kp256.privateKey)).toThrow(/objek/i);
  });

  test('throw error jika payload mengandung nilai non-JSON (BigInt)', () => {
    expect(() => sign(H256, {}, { val: BigInt(1) }, kp256.privateKey)).toThrow(/serialize/i);
  });

  test('throw error jika private key tidak cocok dengan kurva', () => {
    expect(() => sign(H256, {}, {}, kp521.privateKey)).toThrow();
  });
});