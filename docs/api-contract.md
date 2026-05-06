# API Contract — Encrypted Messaging System

> **Tugas 3 II4021 Kriptografi — Semester II 2025/2026**
> Dokumen kontrak API antara Backend (A1), JWT Library (A2), dan Frontend (A3).

---

## Daftar Isi

1. [Informasi Umum](#1-informasi-umum)
2. [Format Response & Error](#2-format-response--error)
3. [Autentikasi (Cookie JWT)](#3-autentikasi-cookie-jwt)
4. [Endpoint: Auth](#4-endpoint-auth)
5. [Endpoint: Users](#5-endpoint-users)
6. [Endpoint: Messages](#6-endpoint-messages)
7. [Interface jwt-lib (A2)](#7-interface-jwt-lib-a2)
8. [Format kdf_params](#8-format-kdf_params)
9. [Key Exchange: ECDH + HKDF](#9-key-exchange-ecdh--hkdf)

---

## 1. Informasi Umum

| Item           | Value                           |
| -------------- | ------------------------------- |
| Base URL       | `http://localhost:5000`         |
| Content-Type   | `application/json`              |
| Auth Mechanism | JWT (ECDSA-signed) disimpan di `httpOnly` cookie |
| Database       | PostgreSQL (Supabase)           |
| CORS Origin    | `http://localhost:3000`         |

---

## 2. Format Response & Error

### Success Response

```json
{
  "message": "Deskripsi singkat keberhasilan",
  "data": { ... }
}
```

### Error Response

Semua error mengikuti format berikut:

```json
{
  "error": "Error Type",
  "message": "Penjelasan error yang human-readable",
  "timestamp": "2026-05-05T13:00:00.000Z"
}
```

### HTTP Status Codes

| Code | Meaning                                         |
| ---- | ------------------------------------------------ |
| 200  | OK — Request berhasil                            |
| 201  | Created — Resource berhasil dibuat               |
| 400  | Bad Request — Request body tidak valid / field kurang |
| 401  | Unauthorized — Tidak terautentikasi / password salah |
| 404  | Not Found — User atau resource tidak ditemukan   |
| 409  | Conflict — Email sudah terdaftar                 |
| 500  | Internal Server Error — Error di server          |

---

## 3. Autentikasi (Cookie JWT)

Setelah login, server mengirim JWT melalui **httpOnly cookie** bernama `token`. JWT ditandatangani secara digital menggunakan **ECDSA** (sesuai RFC 7519, format JWS).

- JWT di-sign dengan **EC private key** (ECDSA) dan di-verify dengan **EC public key**.
- Algoritma yang didukung: `ES256` (P-256), `ES384` (P-384), `ES512` (P-521).
- Cookie bersifat `httpOnly` (tidak bisa diakses JavaScript di browser).
- Cookie bersifat `sameSite: 'lax'` (atau `'none'` jika cross-origin dengan HTTPS).
- Frontend **tidak perlu** mengirim header `Authorization`. Cookie otomatis dikirim oleh browser selama `credentials: 'include'` diset di fetch/axios.
- Semua endpoint yang memerlukan autentikasi ditandai dengan 🔒.

---

## 4. Endpoint: Auth

### 4.1 POST `/auth/register`

Mendaftarkan user baru beserta public key dan encrypted private key.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "plaintext_password",
  "public_key": "-----BEGIN PUBLIC KEY-----\nMFkwEwYH...base64...==\n-----END PUBLIC KEY-----",
  "encrypted_private_key": "base64-encoded-encrypted-private-key",
  "kdf_params": {
    "algorithm": "PBKDF2",
    "hash": "SHA-256",
    "iterations": 100000,
    "salt": "base64-encoded-random-salt",
    "iv": "base64-encoded-iv-for-private-key-encryption"
  }
}
```

| Field                  | Type   | Required | Description                                  |
| ---------------------- | ------ | -------- | -------------------------------------------- |
| email                  | string | ✅       | Email unik user                              |
| password               | string | ✅       | Password plaintext (akan di-hash server-side) |
| public_key             | string | ✅       | Public key ECDH dalam format PEM/base64       |
| encrypted_private_key  | string | ✅       | Private key yang sudah dienkripsi client-side  |
| kdf_params             | object | ✅       | Parameter KDF untuk key derivation (lihat §8) |

**Success Response (201):**

```json
{
  "message": "Registrasi berhasil",
  "data": {
    "email": "user@example.com"
  }
}
```

**Error Responses:**

| Code | Condition             | Response                                               |
| ---- | --------------------- | ------------------------------------------------------ |
| 400  | Field kurang/invalid  | `{ "error": "Bad Request", "message": "Field email, password, public_key, encrypted_private_key, dan kdf_params wajib diisi" }` |
| 409  | Email sudah terdaftar | `{ "error": "Conflict", "message": "Email sudah terdaftar" }` |

---

### 4.2 POST `/auth/login`

Login user dan mendapatkan encrypted private key untuk didekripsi di client.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "plaintext_password"
}
```

| Field    | Type   | Required | Description       |
| -------- | ------ | -------- | ----------------- |
| email    | string | ✅       | Email user        |
| password | string | ✅       | Password plaintext |

**Success Response (200):**

Server mengirim **httpOnly cookie** `token` berisi JWT, dan mengembalikan data yang dibutuhkan client untuk mendekripsi private key:

```json
{
  "message": "Login berhasil",
  "data": {
    "email": "user@example.com",
    "encrypted_private_key": "base64-encoded-encrypted-private-key",
    "kdf_params": {
      "algorithm": "PBKDF2",
      "hash": "SHA-256",
      "iterations": 100000,
      "salt": "base64-encoded-random-salt",
      "iv": "base64-encoded-iv-for-private-key-encryption"
    }
  }
}
```

> **PENTING untuk A3:** Response ini berisi `encrypted_private_key` dan `kdf_params` yang diperlukan untuk mendekripsi private key user di browser. Client harus:
> 1. Derive key dari password user menggunakan `kdf_params`
> 2. Decrypt `encrypted_private_key` menggunakan derived key dan `kdf_params.iv`

**Cookie yang dikirim:**

```
Set-Cookie: token=<JWT_STRING>; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400
```

**Error Responses:**

| Code | Condition          | Response                                                   |
| ---- | ------------------ | ---------------------------------------------------------- |
| 400  | Field kurang       | `{ "error": "Bad Request", "message": "Email dan password wajib diisi" }` |
| 404  | Email tidak ada    | `{ "error": "Not Found", "message": "User tidak ditemukan" }` |
| 401  | Password salah     | `{ "error": "Unauthorized", "message": "Password salah" }` |

---

### 4.3 POST `/auth/logout`

Logout user dengan menghapus cookie JWT.

**Request Body:** _(kosong)_

**Success Response (200):**

```json
{
  "message": "Logout berhasil"
}
```

Server mengirim cookie `token` dengan `Max-Age=0` untuk menghapusnya dari browser:

```
Set-Cookie: token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0
```

---

## 5. Endpoint: Users

> Semua endpoint di bagian ini memerlukan autentikasi 🔒

### 5.1 GET `/users/contacts` 🔒

Mengambil daftar semua email user yang terdaftar, **kecuali** email user yang sedang login.

**Request:** Tidak ada body/query params. User diidentifikasi dari JWT cookie.

**Success Response (200):**

```json
{
  "message": "Daftar kontak berhasil diambil",
  "data": {
    "contacts": [
      "alice@example.com",
      "bob@example.com",
      "charlie@example.com"
    ]
  }
}
```

**Error Responses:**

| Code | Condition        | Response                                                     |
| ---- | ---------------- | ------------------------------------------------------------ |
| 401  | Tidak ada JWT    | `{ "error": "Unauthorized", "message": "Token tidak ditemukan" }` |
| 401  | JWT invalid      | `{ "error": "Unauthorized", "message": "Token tidak valid" }` |

---

### 5.2 GET `/users/:email/pubkey` 🔒

Mengambil public key dari user tertentu. Digunakan client untuk memulai ECDH key exchange.

**URL Parameter:**

| Param | Type   | Description                                  |
| ----- | ------ | -------------------------------------------- |
| email | string | Email user yang ingin diambil public key-nya |

**Contoh Request:**

```
GET /users/alice@example.com/pubkey
```

**Success Response (200):**

```json
{
  "message": "Public key berhasil diambil",
  "data": {
    "email": "alice@example.com",
    "public_key": "-----BEGIN PUBLIC KEY-----\nMFkwEwYH...base64...==\n-----END PUBLIC KEY-----"
  }
}
```

**Error Responses:**

| Code | Condition        | Response                                                     |
| ---- | ---------------- | ------------------------------------------------------------ |
| 401  | Tidak ada JWT    | `{ "error": "Unauthorized", "message": "Token tidak ditemukan" }` |
| 404  | User tidak ada   | `{ "error": "Not Found", "message": "User tidak ditemukan" }` |

---

## 6. Endpoint: Messages

> Semua endpoint di bagian ini memerlukan autentikasi 🔒

### 6.1 POST `/messages` 🔒

Menyimpan pesan terenkripsi. Server menyimpan data apa adanya tanpa mendekripsi.

**Request Body:**

```json
{
  "receiver_email": "alice@example.com",
  "ciphertext": "base64-encoded-aes-encrypted-message",
  "iv": "base64-encoded-initialization-vector",
  "mac": "base64-encoded-hmac-optional"
}
```

| Field          | Type   | Required | Description                                |
| -------------- | ------ | -------- | ------------------------------------------ |
| receiver_email | string | ✅       | Email penerima pesan                       |
| ciphertext     | string | ✅       | Pesan yang sudah dienkripsi (AES)          |
| iv             | string | ✅       | Initialization vector untuk AES            |
| mac            | string | ❌       | HMAC untuk verifikasi integritas (bonus)   |

> **Catatan:** `sender_email` diambil dari JWT (req.user.sub), bukan dari request body. Ini mencegah spoofing pengirim.

> **Catatan:** `timestamp` di-generate oleh server (`CURRENT_TIMESTAMP`), bukan dari client.

**Success Response (201):**

```json
{
  "message": "Pesan berhasil dikirim",
  "data": {
    "id": 42,
    "sender_email": "bob@example.com",
    "receiver_email": "alice@example.com",
    "timestamp": "2026-05-05T13:00:00.000Z"
  }
}
```

**Error Responses:**

| Code | Condition             | Response                                                       |
| ---- | --------------------- | -------------------------------------------------------------- |
| 400  | Field kurang          | `{ "error": "Bad Request", "message": "Field receiver_email, ciphertext, dan iv wajib diisi" }` |
| 401  | Tidak terautentikasi  | `{ "error": "Unauthorized", "message": "Token tidak ditemukan" }` |
| 404  | Penerima tidak ada    | `{ "error": "Not Found", "message": "User penerima tidak ditemukan" }` |

---

### 6.2 GET `/messages?with=:email` 🔒

Mengambil semua pesan antara user yang login dan user lain (dua arah).

**Query Parameter:**

| Param | Type   | Required | Description                        |
| ----- | ------ | -------- | ---------------------------------- |
| with  | string | ✅       | Email lawan bicara                 |

**Contoh Request:**

```
GET /messages?with=alice@example.com
```

**SQL Logic (untuk referensi backend):**

```sql
SELECT * FROM messages
WHERE (sender_email = $1 AND receiver_email = $2)
   OR (sender_email = $2 AND receiver_email = $1)
ORDER BY timestamp ASC;
```

**Success Response (200):**

```json
{
  "message": "Pesan berhasil diambil",
  "data": {
    "messages": [
      {
        "id": 1,
        "sender_email": "bob@example.com",
        "receiver_email": "alice@example.com",
        "ciphertext": "base64-encoded-encrypted-message",
        "iv": "base64-encoded-iv",
        "mac": null,
        "timestamp": "2026-05-05T12:00:00.000Z"
      },
      {
        "id": 2,
        "sender_email": "alice@example.com",
        "receiver_email": "bob@example.com",
        "ciphertext": "base64-encoded-encrypted-message",
        "iv": "base64-encoded-iv",
        "mac": "base64-encoded-hmac",
        "timestamp": "2026-05-05T12:01:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

| Code | Condition             | Response                                                       |
| ---- | --------------------- | -------------------------------------------------------------- |
| 400  | Query param `with` kosong | `{ "error": "Bad Request", "message": "Query parameter 'with' wajib diisi" }` |
| 401  | Tidak terautentikasi  | `{ "error": "Unauthorized", "message": "Token tidak ditemukan" }` |

---

## 7. Interface jwt-lib (A2)

Kontrak interface untuk library JWT yang diimplementasi oleh Anggota 2.
JWT diimplementasikan dalam format **JWS** dan ditandatangani secara digital menggunakan **ECDSA** (sesuai RFC 7519).

### 7.1 `sign(header, claims, payload, privateKey) → string`

Membuat JWT token yang di-sign dengan ECDSA private key.

```javascript
const { sign } = require('../jwt-lib');

const token = sign(
  // header (wajib)
  {
    alg: "ES256",   // ES256 | ES384 | ES512
    typ: "JWT"
  },
  // claims (semua opsional)
  {
    iss: "kriptografi-server",
    sub: "user@example.com",
    aud: "kriptografi-client",
    exp: Math.floor(Date.now() / 1000) + 86400,  // 24 jam dari sekarang
    nbf: Math.floor(Date.now() / 1000),
    iat: Math.floor(Date.now() / 1000),
    jti: "unique-token-id"
  },
  // payload (private claims, opsional)
  {
    email: "user@example.com"
  },
  // privateKey (PEM string)
  privateKeyPEM
);
// Returns: "eyJhbGciOiJFUzI1NiIs..." (JWT string)
```

**Input:**

| Param      | Type   | Required | Description                                                      |
| ---------- | ------ | -------- | ---------------------------------------------------------------- |
| header     | object | ✅       | `{ alg: "ES256" \| "ES384" \| "ES512", typ: "JWT" }`             |
| claims     | object | ❌       | Registered claims: `iss, sub, aud, exp, nbf, iat, jti` (semua opsional) |
| payload    | object | ❌       | Private claims (key-value bebas, harus JSON-serializable)        |
| privateKey | string | ✅       | EC private key dalam format PEM                                  |

> **Catatan:** Jika key di `payload` sama dengan key di `claims`, gunakan nilai dari `claims`.

**Algoritma:**

| `alg`   | Kurva | Hash    |
| ------- | ----- | ------- |
| ES256   | P-256 | SHA-256 |
| ES384   | P-384 | SHA-384 |
| ES512   | P-521 | SHA-512 |

**Output:** `string` — JWT token (format: `base64url(header).base64url(payload).base64url(signature)`)

---

### 7.2 `verify(jwt, publicKey, options?) → object (throws on failure)`

Memverifikasi dan mendekode JWT token. **Throw error** jika token tidak valid.

```javascript
const { verify } = require('../jwt-lib');

try {
  const decoded = verify(
    token,
    publicKeyPEM,
    {
      algs: ["ES256"],              // Algoritma yang diizinkan
      iss: "kriptografi-server",    // Validasi issuer
      sub: "user@example.com",     // Validasi subject
      aud: "kriptografi-client",   // Validasi audience
      ignoreExp: false,             // Jangan abaikan expiration
      ignoreNbf: false              // Jangan abaikan not-before
    }
  );
  console.log(decoded.header);     // { alg: "ES256", typ: "JWT" }
  console.log(decoded.payload);    // { sub: "user@example.com", iat: ..., exp: ... }
} catch (error) {
  // Token invalid, expired, signature mismatch, dll.
  console.error(error.message);
}
```

**Input:**

| Param     | Type   | Required | Description                                          |
| --------- | ------ | -------- | ---------------------------------------------------- |
| jwt       | string | ✅       | JWT token string                                     |
| publicKey | string | ✅       | EC public key dalam format PEM                       |
| options   | object | ❌       | Opsi validasi tambahan (lihat tabel di bawah)        |

**Options:**

| Field     | Type     | Description                                        |
| --------- | -------- | -------------------------------------------------- |
| algs      | string[] | Algoritma yang diizinkan (`["ES256", "ES384", ...]`) |
| iss       | string   | Validasi issuer harus cocok                        |
| sub       | string   | Validasi subject harus cocok                       |
| aud       | string   | Validasi audience harus cocok                      |
| ignoreExp | boolean  | Jika `true`, abaikan validasi expiration           |
| ignoreNbf | boolean  | Jika `true`, abaikan validasi not-before            |
| jti       | string   | Validasi JWT ID harus cocok                        |

**Output:**
- **Jika valid:** `object` — `{ header, payload, signature }`
- **Jika invalid:** **throw Error** dengan pesan yang sesuai (sesuai RFC 7519 §7.2)

---

## 8. Format kdf_params

Format metadata KDF yang dikirim client saat registrasi dan dikembalikan saat login. Server menyimpan data ini apa adanya (opaque) — hanya client yang memahami isinya.

```json
{
  "algorithm": "PBKDF2",
  "hash": "SHA-256",
  "iterations": 100000,
  "salt": "base64-encoded-random-salt-16-bytes",
  "iv": "base64-encoded-iv-12-or-16-bytes"
}
```

| Field      | Type   | Description                                              |
| ---------- | ------ | -------------------------------------------------------- |
| algorithm  | string | Algoritma KDF yang digunakan (`"PBKDF2"`)                |
| hash       | string | Hash function (`"SHA-256"`)                              |
| iterations | number | Jumlah iterasi PBKDF2 (rekomendasi: ≥100000)            |
| salt       | string | Random salt (base64), di-generate client saat registrasi |
| iv         | string | IV untuk enkripsi private key (base64), di-generate client |

### Alur Penggunaan kdf_params

```
┌─────────────────────────────────────────────────────────────────┐
│ REGISTRASI (Client → Server)                                    │
│                                                                 │
│ 1. Client generate ECDH key pair                                │
│ 2. Client generate random salt & IV                             │
│ 3. Client derive AES key dari password via PBKDF2(salt, iter)   │
│ 4. Client encrypt private key menggunakan AES-GCM(key, IV)      │
│ 5. Client kirim ke server:                                      │
│    { public_key, encrypted_private_key, kdf_params }            │
│ 6. Server simpan apa adanya ke database                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LOGIN (Server → Client)                                         │
│                                                                 │
│ 1. Server return { encrypted_private_key, kdf_params }          │
│ 2. Client derive AES key dari password via PBKDF2               │
│    menggunakan salt & iterations dari kdf_params                │
│ 3. Client decrypt encrypted_private_key menggunakan             │
│    AES-GCM(derived_key, kdf_params.iv)                          │
│ 4. Client sekarang punya private key untuk ECDH                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Key Exchange: ECDH + HKDF

Ketika dua pengguna mulai berkomunikasi, kedua sisi menjalankan proses key exchange untuk menghasilkan kunci simetris AES-256 yang sama.

### Alur Key Exchange

```
┌──────────────────────────────────────────────────────────────────┐
│ KEY EXCHANGE (Client-side, menggunakan Web Crypto API)           │
│                                                                  │
│ 1. Client ambil public key lawan dari GET /users/:email/pubkey   │
│ 2. Client hitung shared secret via ECDH:                         │
│    sharedSecret = ECDH(myPrivateKey, theirPublicKey)              │
│ 3. Client derive AES-256 key via HKDF:                           │
│    aesKey = HKDF(sharedSecret, salt, info, 256)                  │
│ 4. Kedua sisi menghasilkan aesKey yang sama                      │
│ 5. aesKey digunakan untuk AES-256 encrypt/decrypt pesan          │
└──────────────────────────────────────────────────────────────────┘
```

> **PENTING:** Seluruh operasi kriptografi di sisi klien (ECDH, HKDF, AES) **wajib menggunakan Web Crypto API**.

---

## Catatan untuk Frontend (A3)

1. **Semua fetch request harus include credentials:**
   ```javascript
   fetch('http://localhost:5000/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     credentials: 'include',  // ← WAJIB untuk cookie
     body: JSON.stringify({ email, password })
   });
   ```

2. **Setelah login, cookie `token` otomatis dikirim** di setiap request berikutnya. Tidak perlu menambahkan header `Authorization`.

3. **Enkripsi pesan dilakukan sepenuhnya di client** menggunakan **AES-256**. Server hanya menyimpan ciphertext, IV, dan MAC tanpa memahami isinya. Varian AES dibebaskan (e.g., AES-256-GCM, AES-256-CBC).

4. **Key exchange (ECDH) dilakukan di client** menggunakan public key yang diambil dari endpoint `/users/:email/pubkey`. Shared secret diproses menggunakan **HKDF** untuk menghasilkan kunci AES-256.

5. **Semua operasi kriptografi client-side wajib menggunakan Web Crypto API** (ECDH, HKDF, AES). Penggunaan library secure messaging langsung tidak diperbolehkan.
