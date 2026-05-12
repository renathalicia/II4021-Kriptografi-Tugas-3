import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateECDHKeyPair, exportPublicKey, exportPrivateKey } from '../crypto/ecdh';
import { deriveKeyFromPassword } from '../crypto/pbkdf2';
import { encryptAES } from '../crypto/aes';
import { authAPI } from '../services/api';
import { arrayBufferToBase64 } from '../crypto/encoding';
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
      console.log('Generating ECDH keypair...');
      const keyPair = await generateECDHKeyPair();

      console.log('Exporting keys...');
      const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
      const privateKeyBase64 = await exportPrivateKey(keyPair.privateKey);

      console.log('Deriving encryption key...');
      const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
      const salt = arrayBufferToBase64(saltBytes.buffer);
      const encryptionKey = await deriveKeyFromPassword(password, salt);

      console.log('Encrypting private key...');
      const { ciphertext: encryptedPrivateKey, iv } = await encryptAES(
        privateKeyBase64,
        encryptionKey
      );

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
