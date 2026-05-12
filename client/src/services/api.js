import { API_BASE_URL, JWT_COOKIE_NAME, JWT_MAX_AGE } from '../utils/constants';

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

async function fetchWithAuth(endpoint, options = {}) {
  const jwt = getJWTFromCookie();
  
  const config = {
    credentials: 'include',
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

export const authAPI = {
  // Register user baru
  async register(email, password, publicKey, encryptedPrivateKey, privateKeyIV, salt) {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        public_key: publicKey,
        encrypted_private_key: encryptedPrivateKey,
        kdf_params: {
          iv: privateKeyIV,
          salt: salt
        }
      })
    });
  },

  // Login user
  async login(email, password) {
    const result = await fetchWithAuth('/auth/login', {
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
  async logout() {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    }
    clearJWTCookie();
    sessionStorage.clear();
  }
};

export const usersAPI = {
  // Get all users (untuk daftar kontak)
  async getAll() {
    return fetchWithAuth('/users/contacts');
  },

  // Get public key dari user tertentu
  async getPublicKey(email) {
    return fetchWithAuth(`/users/${encodeURIComponent(email)}/pubkey`);
  }
};

export const messagesAPI = {
  async send(senderEmail, receiverEmail, ciphertext, iv, mac) {
    return fetchWithAuth('/messages', {
      method: 'POST',
      body: JSON.stringify({
        receiver_email: receiverEmail,
        ciphertext,
        iv,
        mac
      })
    });
  },

  async getHistory(user1, user2) {
    const currentEmail = sessionStorage.getItem('email');
    const lawanBicara = user1 === currentEmail ? user2 : user1;
    
    return fetchWithAuth(
      `/messages?with=${encodeURIComponent(lawanBicara)}`
    );
  },

  async getNew(user1, user2, afterId) {
    const currentEmail = sessionStorage.getItem('email');
    const lawanBicara = user1 === currentEmail ? user2 : user1;
    
    return fetchWithAuth(
      `/messages?with=${encodeURIComponent(lawanBicara)}&afterId=${encodeURIComponent(afterId)}`
    );
  }
};
