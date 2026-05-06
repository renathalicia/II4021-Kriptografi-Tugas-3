import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deriveKeyFromPassword } from '../crypto/pbkdf2';
import { decryptAES } from '../crypto/aes';
import { importPrivateKey } from '../crypto/ecdh';
import { authAPI, getJWTFromCookie } from '../services/api';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if already logged in
  useEffect(() => {
    const jwt = getJWTFromCookie();
    const privateKey = sessionStorage.getItem('privateKey');
    if (jwt && privateKey) {
      navigate('/contacts');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // STEP 1: Authenticate with server
      console.log('Authenticating...');
      const result = await authAPI.login(email, password);

      const {
        jwt,
        encryptedPrivateKey,
        privateKeyIV,
        salt,
        publicKey
      } = result;

      // JWT already saved to cookie by authAPI.login()

      // STEP 2: Derive encryption key
      console.log('Deriving encryption key...');
      const encryptionKey = await deriveKeyFromPassword(password, salt);

      // STEP 3: Decrypt private key
      console.log('Decrypting private key...');
      const privateKeyBase64 = await decryptAES(
        encryptedPrivateKey,
        privateKeyIV,
        encryptionKey
      );

      // STEP 4: Import private key to verify
      await importPrivateKey(privateKeyBase64);

      // STEP 5: Store in session storage
      console.log('Storing keys in session...');
      sessionStorage.setItem('privateKey', privateKeyBase64);
      sessionStorage.setItem('publicKey', publicKey);
      sessionStorage.setItem('email', email);

      // Navigate to contacts
      navigate('/contacts');

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login</h1>

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
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        {error && <div className="alert alert-danger">{error}</div>}

        <p className="text-center">
          Belum punya akun? <a href="/register">Daftar di sini</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
