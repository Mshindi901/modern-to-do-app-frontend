import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser } from '../api/userApi.js';
import { signIn, signUp } from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(sessionStorage.getItem('todo_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const decodeToken = (jwtToken) => {
    try {
      const payload = jwtToken.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return { id: decoded.id, role: decoded.role };
    } catch {
      return null;
    }
  };

  const refreshUser = async (jwtToken) => {
    if (!jwtToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    const decoded = decodeToken(jwtToken);

    if (!decoded) {
      sessionStorage.removeItem('todo_token');
      setToken('');
      setUser(null);
      setLoading(false);
      return;
    }

    setUser({
      id: decoded.id,
      role: decoded.role,
    });

    try {
      const response = await getCurrentUser();
      const profile = response?.data?.data || response?.data || {};
      setUser({
        id: decoded?.id || profile.id || profile.user_id,
        role: decoded?.role || profile.role || 'user',
        name: profile.name,
        email: profile.email,
      });
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        sessionStorage.removeItem('todo_token');
        setToken('');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.removeItem('todo_token');
    refreshUser(token);
  }, [token]);

  const login = async (credentials) => {
    const response = await signIn(credentials);
    const jwtToken = response?.data?.data || response?.data?.token;

    if (!jwtToken) {
      throw new Error('Login response missing token');
    }

    sessionStorage.setItem('todo_token', jwtToken);
    const decoded = decodeToken(jwtToken);

    if (!decoded) {
      throw new Error('Token is invalid');
    }

    setUser({
      id: decoded.id,
      role: decoded.role || 'user',
    });
    setToken(jwtToken);

    return { user: { ...decoded }, token: jwtToken };
  };

  const register = async (payload) => {
    const response = await signUp(payload);
    return response;
  };

  const logout = () => {
    sessionStorage.removeItem('todo_token');
    setToken('');
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, isAuthenticated: !!token && !!user, loading, login, logout, register }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
