'use client';

import { STORAGE_KEYS } from '@/constant';
import {
  AUTHENTICATION_CONSTANTS,
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
import { toast } from 'sonner';
import { IZkProof, IEphemeralKeyPair } from 'mmn-client-js';
import { safeJsonParse, clearAuthStorage } from '@/utils';

interface AppContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  zkProof: IZkProof | null;
  setZkProof: (zk: IZkProof | null) => void;
  keypair: IEphemeralKeyPair | null;
  setKeypair: (keypair: IEphemeralKeyPair | null) => void;
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
  const [zkProof, setZkProof] = useState<IZkProof | null>(null);
  const [keypair, setKeypair] = useState<IEphemeralKeyPair | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const localTokenStr = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const localToken = localTokenStr ? safeJsonParse(localTokenStr) : null;
    if (localToken) {
      (async () => {
        try {
          await AuthenticationService.refreshLogin(localToken.refresh_token);
        } catch {
          toast.error('Session expired, please log in again.');
        }
      })();
    }
    const userStored = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (userStored) {
      const u = safeJsonParse(userStored);
      setUser(u);
      setIsAuthenticated(true);
      const zkStr = localStorage.getItem(STORAGE_KEYS.ZK_PROOF);
      if (zkStr) setZkProof(safeJsonParse(zkStr));

      const kpStr = localStorage.getItem(STORAGE_KEYS.KEY_PAIR);
      if (kpStr) setKeypair(safeJsonParse(kpStr));
      return;
    }
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code) return;

    const handleAuthentication = async (authCode: string) => {
      try {
        const userInfo: LoginResponse = await AuthenticationService.getUserInfo(authCode);
        setIsAuthenticated(true);

        let restored = false;
        if (state) {
          const redirectUrl = localStorage.getItem(AUTHENTICATION_CONSTANTS.LOGIN_REDIRECT);
          if (redirectUrl) {
            router.replace(redirectUrl);
            localStorage.removeItem(AUTHENTICATION_CONSTANTS.LOGIN_REDIRECT);
            restored = true;
          }
        }
        if (!restored) router.replace('/');

        handleTokenStorage(userInfo);

        const keypair = generateAndStoreKeyPair();
        setKeypair(keypair);

        const senderAddress = mmnClient.getAddressFromUserId(userInfo.user.user_id);
        const userObject = processAndStoreUser(userInfo.user, senderAddress);
        setUser(userObject);

        const fetchedZk = await fetchAndStoreZkProof(
          userInfo.user.user_id || userInfo.user.sub,
          keypair.publicKey,
          userInfo.auth_token,
          senderAddress
        );
        if (fetchedZk) {
          setZkProof(fetchedZk);
        }

        toast.success('Login successful!');
      } catch {
        toast.error('Login failed!');
        clearAuthStorage();
        router.push('/');
      }
    };

    handleAuthentication(code);
  }, []);

  const value: AppContextType = {
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
    zkProof,
    setZkProof,
    keypair,
    setKeypair,
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

export function useZkProof() {
  const { zkProof, setZkProof } = useApp();
  return { zkProof, setZkProof };
}

export function useKeypair() {
  const { keypair, setKeypair } = useApp();
  return { keypair, setKeypair };
}

export function useAuthActions() {
  const { setIsAuthenticated, setUser, setZkProof, setKeypair } = useApp();

  const login = () => {
    localStorage.setItem(AUTHENTICATION_CONSTANTS.LOGIN_REDIRECT, window.location.href);
    window.location.href = AUTHENTICATION_ENDPOINT.LOGIN;
  };

  const logout = () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const refreshToken = token ? safeJsonParse(token).refresh_token : null;
    if (refreshToken) {
      axios.post(AUTHENTICATION_ENDPOINT.LOGOUT, { refresh_token: refreshToken });
    }
    clearAuthStorage();
    setUser(null);
    setZkProof(null);
    setKeypair(null);
    setIsAuthenticated(false);
  };

  return { login, logout };
}
