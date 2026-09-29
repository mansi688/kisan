import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [farmer, setFarmer] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('ku_farmer').then(raw => {
      if (raw) setFarmer(JSON.parse(raw));
      setReady(true);
    });
  }, []);

  const login = useCallback(async (farmerData, token) => {
    await AsyncStorage.setItem('ku_token', token);
    await AsyncStorage.setItem('ku_farmer', JSON.stringify(farmerData));
    setFarmer(farmerData);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['ku_token', 'ku_farmer']);
    setFarmer(null);
  }, []);

  return (
    <AuthContext.Provider value={{ farmer, login, logout, ready, isAuthenticated: !!farmer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
