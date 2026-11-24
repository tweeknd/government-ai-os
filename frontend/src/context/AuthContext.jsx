import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginAPI } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('gov_token');
    const storedUser = localStorage.getItem('gov_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('gov_token');
        localStorage.removeItem('gov_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginAPI(email, password);
    const { token: jwt, user: userData } = res.data;
    localStorage.setItem('gov_token', jwt);
    localStorage.setItem('gov_user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gov_token');
    localStorage.removeItem('gov_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const isAuthenticated = !!token && !!user;

  const hasRole = useCallback(
    (roles) => {
      if (!user) return false;
      if (!roles || roles.length === 0) return true;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
