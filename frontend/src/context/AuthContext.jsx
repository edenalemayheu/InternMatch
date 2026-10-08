/**
 * AuthContext — session state, login/logout/signup helpers.
 * Components use the useAuth() hook exclusively.
 * Never import from mock files directly here.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../lib/apiClient.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    api.getCurrentUser().then(u => {
      setUser(u || null);
    }).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: u } = await api.login(email, password);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (email, password, role) => {
    const { user: u } = await api.signup(email, password, role);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await api.getCurrentUser();
    setUser(u || null);
    return u;
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
