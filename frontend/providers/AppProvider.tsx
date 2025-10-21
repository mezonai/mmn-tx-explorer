'use client';

import axios from 'axios';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  walletAdress: string;
}

interface AppProviderProps {
  children: ReactNode;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: AppProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const value: AppContextType = {
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }

  return context;
}

export function useAuth() {
  const { isAuthenticated, setIsAuthenticated } = useApp();
  return { isAuthenticated, setIsAuthenticated };
}

export function useUser() {
  const { user, setUser } = useApp();
  return { user, setUser };
}

export function useAuthActions() {
  const { setIsAuthenticated, setUser } = useApp();

  const login = () => {
    window.location.href = '/oauth2/login';
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token');
    axios.post('/oauth2/logout', { refresh_token: refreshToken });
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('key_pair');
    localStorage.removeItem('zkProof');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  return { login, logout };
}
