import { API_BASE_URL, JWT_COOKIE_NAME, JWT_MAX_AGE } from '../utils/constants';

// ============================================
// JWT Cookie Management
// ============================================

export function getJWTFromCookie() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === JWT_COOKIE_NAME) return value;
  }
  return null;
}

export function setJWTCookie(jwt, maxAge = JWT_MAX_AGE) {
  document.cookie = `${JWT_COOKIE_NAME}=${jwt}; max-age=${maxAge}; path=/; SameSite=Strict`;
}

export function clearJWTCookie() {
  document.cookie = `${JWT_COOKIE_NAME}=; max-age=0; path=/`;
}

// ============================================
// Generic Fetch dengan Auth
// ============================================

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
    const error = await response.json().catch(() => ({ 
      message: `HTTP Error ${response.status}` 
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// ============================================
// Auth API
// ============================================

export const authAPI = {
  // Register user baru
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

  // Login user
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

  // Logout user
  logout() {
    clearJWTCookie();
    sessionStorage.clear();
  }
};

// ============================================
// Users API
// ============================================

export const usersAPI = {
  // Get all users (untuk daftar kontak)
  async getAll() {
    return fetchWithAuth('/users');
  },

  // Get public key dari user tertentu
  async getPublicKey(email) {
    return fetchWithAuth(`/users/${encodeURIComponent(email)}/publicKey`);
  }
};

// ============================================
// Messages API
// ============================================

export const messagesAPI = {
  // Kirim pesan baru
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

  // Get message history
  async getHistory(user1, user2) {
    return fetchWithAuth(
      `/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`
    );
  },

  // Get new messages setelah timestamp tertentu
  async getNew(user1, user2, afterTimestamp) {
    return fetchWithAuth(
      `/messages/new?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}&after=${afterTimestamp}`
    );
  }
};