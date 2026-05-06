// helper function untuk encoding/decoding Base64URL
// dipakai oleh sign.js dan verify.js

function base64urlEncode(data) {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return buf.toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64urlDecode(data) {
    const padded = data + "=".repeat((4 - (data.length % 4)) % 4);
    const base64 = padded
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    return Buffer.from(base64, 'base64');
}

// encode object JavaScript ke Base64URL
// untuk encode header dan payload JWT
function encodeObjectToBase64url(obj) {
    const json = JSON.stringify(obj);
    return base64urlEncode(Buffer.from(json, 'utf-8'));
}

// decode Base64URL ke object JavaScript
// untuk decode header dan payload JWT saat verify
function decodeBase64urlToObject(str) {
    const buf = base64urlDecode(str);
    return JSON.parse(buf.toString('utf-8'));
}

module.exports = {
    base64urlEncode,
    base64urlDecode,
    encodeObjectToBase64url,
    decodeBase64urlToObject
};