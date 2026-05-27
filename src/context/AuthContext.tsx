import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser } from '../api';
import { getMe } from '../api';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, loading: true,
  signIn: () => {}, signOut: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('kanban_token');
    if (!stored) { setLoading(false); return; }
    setToken(stored);
    getMe()
      .then(u => setUser(u))
      .catch(() => { localStorage.removeItem('kanban_token'); })
      .finally(() => setLoading(false));
  }, []);

  const signIn = (t: string, u: AuthUser) => {
    localStorage.setItem('kanban_token', t);
    setToken(t);
    setUser(u);
  };

  const signOut = () => {
    localStorage.removeItem('kanban_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
