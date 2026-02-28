import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth';
import type { AuthRequest, RegisterRequest, UserDTO } from '../api/types';
import { setToken, getToken } from '../api/client';

interface AuthContextType {
  user: UserDTO | null;
  loading: boolean;
  login: (creds: AuthRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMe = async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch (err) {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // on mount try to load user from token
    const token = getToken();
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (creds: AuthRequest) => {
    const resp = await apiLogin(creds);
    setToken(resp.token);
    await fetchMe();
  };

  const register = async (data: RegisterRequest) => {
    const resp = await apiRegister(data);
    setToken(resp.token);
    await fetchMe();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
