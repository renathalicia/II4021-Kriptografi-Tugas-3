/**
 * Register Page Component
 * Location: client/src/pages/Register.jsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  generateECDHKeyPair,
  exportPublicKey,
  exportPrivateKey,
  deriveKeyFromPassword,
  encryptAES
} from '../crypto/cryptoHelpers';
import { authAPI } from '../services/api';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // STEP 1: Generate ECDH keypair
      console.log('Generating ECDH keypair...');
      const keyPair = await generateECDHKeyPair();

      // STEP 2: Export keys
      console.log('Exporting keys...');
      const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
      const privateKeyBase64 = await exportPrivateKey(keyPair.privateKey);

      // STEP 3: Derive encryption key from password
      console.log('Deriving encryption key...');
      const salt = email; // Gunakan email sebagai salt
      const encryptionKey = await deriveKeyFromPassword(password, salt);

      // STEP 4: Encrypt private key
      console.log('Encrypting private key...');
      const { ciphertext: encryptedPrivateKey, iv } = await encryptAES(
        privateKeyBase64,
        encryptionKey
      );

      // STEP 5: Send to server
      console.log('Sending to server...');
      await authAPI.register(
        email,
        password,
        publicKeyBase64,
        encryptedPrivateKey,
        iv,
        salt
      );

      setSuccess('Registrasi berhasil! Mengalihkan ke login...');
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Daftar Akun Baru</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <p className="text-center">
          Sudah punya akun? <a href="/login">Login di sini</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
