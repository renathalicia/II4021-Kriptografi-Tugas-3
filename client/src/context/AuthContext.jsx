import { createContext, useContext, useState, useEffect } from 'react';
import { getJWTFromCookie, authAPI } from '../services/api';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const jwt = getJWTFromCookie();
    const privateKey = sessionStorage.getItem(STORAGE_KEYS.PRIVATE_KEY);
    const email = sessionStorage.getItem(STORAGE_KEYS.EMAIL);
    
    if (jwt && privateKey && email) {
      setIsAuthenticated(true);
      setUser({ email });
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    
    setLoading(false);
  };

  const login = (email, privateKey, publicKey) => {
    sessionStorage.setItem(STORAGE_KEYS.EMAIL, email);
    sessionStorage.setItem(STORAGE_KEYS.PRIVATE_KEY, privateKey);
    sessionStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, publicKey);
    
    setIsAuthenticated(true);
    setUser({ email });
  };

  const logout = async () => {
    await authAPI.logout();
    sessionStorage.removeItem(STORAGE_KEYS.EMAIL);
    sessionStorage.removeItem(STORAGE_KEYS.PRIVATE_KEY);
    sessionStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook untuk pakai auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}