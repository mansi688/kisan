import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { clearAllSessions, saveFarmerSession, readFarmer, SESSION_EVENT } from './session.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [farmer, setFarmer] = useState(readFarmer);

  // Stay in sync when the session changes anywhere else: another role logs in,
  // a 401 clears everything, or the person logs out in a different tab.
  useEffect(() => {
    const sync = () => setFarmer(readFarmer());
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const login = useCallback((farmerData, token) => {
    saveFarmerSession(farmerData, token);
    setFarmer(farmerData);
  }, []);

  const logout = useCallback(() => {
    clearAllSessions();
    setFarmer(null);
  }, []);

  return (
    <AuthContext.Provider value={{ farmer, login, logout, isAuthenticated: !!farmer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
