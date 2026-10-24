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
  const [sessionExpired, setSessionExpired] = useState(false);

  // Restore the session on mount, and hear about sessions that can no longer be renewed
  useEffect(() => {
    api.getCurrentUser()
      .then(({ user: u }) => setUser(u || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return api.onSessionExpired(() => { setUser(null); setSessionExpired(true); });
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: u } = await api.login(email, password);
    setSessionExpired(false);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (email, password, role) => {
    const { user: u } = await api.signup(email, password, role);
    setSessionExpired(false);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { user: u } = await api.getCurrentUser();
    setUser(u || null);
    return u;
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, sessionExpired, login, signup, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
