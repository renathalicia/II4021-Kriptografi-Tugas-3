/**
 * API Service untuk komunikasi dengan backend
 * Location: client/src/services/api.js
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper untuk get JWT from cookie
function getJWTFromCookie() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'jwt') return value;
  }
  return null;
}

// Helper untuk set JWT cookie
function setJWTCookie(jwt, maxAge = 86400) {
  document.cookie = `jwt=${jwt}; max-age=${maxAge}; path=/; SameSite=Strict`;
}

// Helper untuk clear JWT cookie
function clearJWTCookie() {
  document.cookie = 'jwt=; max-age=0; path=/';
}

// Generic fetch dengan JWT auth
async function fetchWithAuth(endpoint, options = {}) {
  const jwt = getJWTFromCookie();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(jwt && { 'Authorization': `Bearer ${jwt}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  async register(email, password, publicKey, encryptedPrivateKey, privateKeyIV, salt) {
    return fetchWithAuth('/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        publicKey,
        encryptedPrivateKey,
        privateKeyIV,
        salt
      })
    });
  },

  async login(email, password) {
    const result = await fetchWithAuth('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // Save JWT to cookie
    if (result.jwt) {
      setJWTCookie(result.jwt);
    }
    
    return result;
  },

  logout() {
    clearJWTCookie();
    sessionStorage.clear();
  }
};

// ============================================
// USERS API
// ============================================

export const usersAPI = {
  async getAll() {
    return fetchWithAuth('/users');
  },

  async getPublicKey(email) {
    return fetchWithAuth(`/users/${encodeURIComponent(email)}/publicKey`);
  }
};

// ============================================
// MESSAGES API
// ============================================

export const messagesAPI = {
  async send(senderEmail, receiverEmail, ciphertext, iv, mac) {
    return fetchWithAuth('/messages', {
      method: 'POST',
      body: JSON.stringify({
        sender_email: senderEmail,
        receiver_email: receiverEmail,
        ciphertext,
        iv,
        mac,
        timestamp: new Date().toISOString()
      })
    });
  },

  async getHistory(user1, user2) {
    return fetchWithAuth(`/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`);
  },

  async getNew(user1, user2, afterTimestamp) {
    return fetchWithAuth(
      `/messages/new?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}&after=${afterTimestamp}`
    );
  }
};

// Export helpers
export { getJWTFromCookie, setJWTCookie, clearJWTCookie };
