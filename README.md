# II4021 Kriptografi — Tugas III

## Aplikasi Chat Web dengan Kriptografi Kunci-Simetri dan Kunci-Publik
Proyek ini merupakan implementasi tugas ketiga dari mata kuliah II4021 Kriptografi. Aplikasi chat berbasis web ini menerapkan mekanisme kriptografi end-to-end, meliputi autentikasi JWT dengan ECDSA, pembentukan kunci komunikasi melalui ECDH + HKDF, dan enkripsi pesan menggunakan AES-256-GCM. Server berperan sebagai perantara "buta" yang tidak dapat mengakses plaintext pesan maupun shared secret pengguna.

---

## Struktur Repository
```
II4021-Kriptografi-Tugas-3/
│
├── client/                 # Frontend React + Vite
│   └── src/
│       ├── crypto/         # Modul kriptografi sisi klien (Web Crypto API)
│       │   ├── aes.js      # AES-256-GCM encrypt/decrypt
│       │   ├── ecdh.js     # ECDH key pair & shared secret
│       │   ├── encoding.js # Utilitas encoding Base64/hex
│       │   ├── hkdf.js     # HKDF key derivation
│       │   ├── hmac.js     # HMAC-SHA-256 untuk MAC pesan
│       │   └── pbkdf2.js   # PBKDF2 untuk enkripsi private key
│       ├── pages/          # Register, Login, Contacts, Chat
│       ├── components/     # Komponen reusable
│       ├── context/        # AuthContext
│       ├── hooks/          # usePolling
│       └── services/       # API service layer
│
├── server/                 # Backend Node.js + Express
│   ├── db/                 # Koneksi PostgreSQL & schema SQL
│   ├── middleware/         # Middleware autentikasi JWT
│   ├── models/             # Model database (user, message)
│   ├── routes/             # Endpoint API (auth, users, messages)
│   ├── utils/              # Utilitas hashing password
│   ├── app.js              # Konfigurasi Express
│   └── server.js           # Entry point server
│
├── jwt-lib/                # Custom JWT Library (ECDSA)
│   ├── tests/
│   │   ├── sign.test.js    # Unit test fungsi sign
│   │   └── verify.test.js  # Unit test fungsi verify
│   ├── sign.js             # Implementasi sign JWT
│   ├── verify.js           # Implementasi verify JWT
│   ├── utils.js            # Utilitas Base64url & encoding
│   └── index.js            # Ekspor library
│
├── docker/                 # Konfigurasi Docker
│   ├── Dockerfile.client   # Build image frontend (Nginx)
│   ├── Dockerfile.server   # Build image backend
│   └── nginx.conf          # Konfigurasi Nginx
│
├── docs/                   # Dokumen spesifikasi tugas
├── generate-keys.js        # Script generate EC key pair P-256
├── docker-compose.yml
└── README.md
```

---

## Teknologi yang Digunakan

### Client
- **React 18** + **React Router DOM 6**: Library UI dan routing halaman.
- **Vite 5**: Build tool dan dev server.
- **Web Crypto API**: Seluruh operasi kriptografi sisi klien — ECDH, HKDF, AES-256-GCM, PBKDF2, HMAC.

### Server
- **Node.js** + **Express.js 4**: Runtime dan framework HTTP server.
- **PostgreSQL**: Database untuk menyimpan data pengguna dan pesan terenkripsi.
- **bcrypt**: Hashing password dengan salt unik.
- **cookie-parser**, **cors**, **dotenv**, **express-validator**: Middleware pendukung.

### JWT Library
- **Node.js `crypto` module**: Operasi ECDSA (ES256/ES384/ES512) untuk sign dan verify JWT — diimplementasikan dari scratch tanpa library JWT eksternal.
- **Jest 29**: Framework unit testing.

### Docker *(bonus)*
- **Docker Compose** + **Nginx**: Orkestrasi container server dan client.

---

## Tata Cara Menjalankan Program

### Persiapan Lingkungan
Pastikan sudah menginstal **Node.js >= 16** dan **npm**. Install dependensi untuk setiap submodule:
```bash
cd server  && npm install && cd ..
cd client  && npm install && cd ..
cd jwt-lib && npm install && cd ..
```

Buat file `.env` di root directory:
```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=ganti-dengan-secret-yang-kuat
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:5173
```

### Menjalankan Secara Lokal
Jalankan backend (terminal pertama):
```bash
cd server && npm run dev
```

Jalankan frontend (terminal kedua):
```bash
cd client && npm run dev
```

Buka browser di `http://localhost:5173`.

### Menjalankan dengan Docker *(bonus)*
```bash
docker compose up --build
```
Akses aplikasi di `http://localhost`. Server tersedia di `http://localhost:5001`.

### Menjalankan Unit Test
```bash
cd jwt-lib && npm test
```

---

## Anggota Kelompok
| NIM      | Nama Lengkap              |
|----------|---------------------------|
| 18223011 | Samuel Chris Michael Bagasta S     |
| 18223017 | Carlen Asadel Axelle    |
| 18223097 | Audy Alicia Renatha Tirayoh |
