#!/usr/bin/env node
// GENERATE EC KEY PAIR (P-256 / ES256)
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, 'keys');

if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
    console.log('📁 Folder keys/ dibuat');
}

const privateKeyPath = path.join(KEYS_DIR, 'ec_private.pem');
const publicKeyPath = path.join(KEYS_DIR, 'ec_public.pem');

const force = process.argv.includes('--force');

if (!force && (fs.existsSync(privateKeyPath) || fs.existsSync(publicKeyPath))) {
    console.error(
        '⚠️  Key sudah ada di folder keys/\n' +
        '   Gunakan flag --force untuk generate ulang (akan menimpa key lama):\n' +
        '   node generate-keys.js --force'
    );
    process.exit(1);
}

console.log('🔑 Generating EC P-256 key pair...');

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
fs.writeFileSync(publicKeyPath, publicKey, { mode: 0o644 });

console.log('✅ Key berhasil di-generate:');
console.log('   Private key :', privateKeyPath);
console.log('   Public key  :', publicKeyPath);
console.log('');
console.log('⚠️  PENTING: Jangan commit keys/ec_private.pem ke git!');
console.log('   Pastikan file keys/ sudah ada di .gitignore');
console.log('');

try {
    const testData = 'test-signature-verification';
    const signer = crypto.createSign('SHA256');
    signer.update(testData);
    const signature = signer.sign(privateKey);

    const verifier = crypto.createVerify('SHA256');
    verifier.update(testData);
    const ok = verifier.verify(publicKey, signature);

    if (ok) {
        console.log('✅ Verifikasi key berhasil — key pair valid dan siap digunakan.');
    } else {
        console.error('❌ Verifikasi key GAGAL — ada masalah dengan key yang di-generate.');
        process.exit(1);
    }
} catch (err) {
    console.error('❌ Error saat verifikasi key:', err.message);
    process.exit(1);
}