'use client';

import { STORAGE_KEYS } from '@/constant';
import {
  AUTHENTICATION_ENDPOINT,
  AuthenticationService,
  fetchAndStoreZkProof,
  generateAndStoreKeyPair,
  handleTokenStorage,
  LoginResponse,
  mmnClient,
  processAndStoreUser,
} from '@/modules/auth';
import axios from 'axios';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  walletAddress: string;
}

interface AppProviderProps {
  children: ReactNode;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: AppProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const localTokenStr = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const localToken = localTokenStr ? JSON.parse(localTokenStr) : null;
    if (localToken) {
      (async () => {
        try {
          const response = await AuthenticationService.refreshLogin(localToken.refresh_token);
          localStorage.setItem(
            STORAGE_KEYS.TOKEN,
            JSON.stringify({
              access_token: response.access_token,
              refresh_token: response.refresh_token,
            })
          );
        } catch (error) {
          console.error('Error:', error);
        }
      })();
    }
    const userStored = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (userStored) {
      setUser(JSON.parse(userStored));
      setIsAuthenticated(true);
      return;
    }
    const code = searchParams.get('code');
    if (!code) return;

    const handleAuthentication = async (authCode: string) => {
      try {
        const userInfo: LoginResponse = await AuthenticationService.getUserInfo(authCode);
        setIsAuthenticated(true);
        router.replace('/');
        handleTokenStorage(userInfo);
        const keypair = generateAndStoreKeyPair();
        const senderAddress = mmnClient.getAddressFromUserId(userInfo.user.user_id || userInfo.user.sub);
        const userObject = processAndStoreUser(userInfo.user, senderAddress);
        setUser(userObject);
        await fetchAndStoreZkProof(userInfo.user.user_id, keypair.publicKey, userInfo.auth_token, senderAddress);
      } catch (error) {
        console.error('Login fail', error);
        router.push('/');
      }
    };

    handleAuthentication(code);
  }, [router, searchParams]);
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
    window.location.href = AUTHENTICATION_ENDPOINT.LOGIN;
  };

  const logout = () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    axios.post(AUTHENTICATION_ENDPOINT.LOGOUT, { refresh_token: refreshToken });
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  return { login, logout };
}
