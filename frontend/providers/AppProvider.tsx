'use client';

import { STORAGE_KEYS } from '@/constant';
import { AUTHENTICATION_ENDPOINT } from '@/modules/auth';
import axios from 'axios';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AuthenticationService } from '@/modules/auth/api';
import type { LoginResponse } from '@/modules/auth/type';
import { mmnClient, zkClient } from '@/modules/auth/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { EZkClientType } from 'mmn-client-js';

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
      return;
    }
    const code = searchParams.get('code');
    console.log(code);
    if (!code) return;
    const fetchUserInfo = async () => {
      try {
        const userInfo: LoginResponse = await AuthenticationService.getUserInfo(code);
        setIsAuthenticated(true);
        router.replace('/');
        localStorage.setItem(
          STORAGE_KEYS.TOKEN,
          JSON.stringify({
            access_token: userInfo.access_token,
            refresh_token: userInfo.refresh_token,
          })
        );
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, userInfo.auth_token);
        const keypair = mmnClient.generateEphemeralKeyPair();
        localStorage.setItem(STORAGE_KEYS.KEY_PAIR, JSON.stringify(keypair));
        const senderAddress = mmnClient.getAddressFromUserId(userInfo.user.user_id || userInfo.user.sub);
        const userObj = {
          id: userInfo.user.user_id || userInfo.user.sub,
          username: userInfo.user.username || userInfo.user.display_name || '',
          email: userInfo.user.email,
          avatar: userInfo.user.avatar,
          walletAddress: senderAddress,
        };
        setUser(userObj);
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userObj));
        const zkProof = await zkClient.getZkProofs({
          userId: userInfo.user.user_id,
          ephemeralPublicKey: keypair.publicKey,
          jwt: userInfo.auth_token,
          address: senderAddress,
          clientType: EZkClientType.OAUTH,
        });
        localStorage.setItem(STORAGE_KEYS.ZK_PROOF, JSON.stringify(zkProof.proof || zkProof));
      } catch (error) {
        console.error('Error fetching user info in AppProvider', error);
      }
    };
    fetchUserInfo();
  }, []);
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
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(STORAGE_KEYS.KEY_PAIR);
    localStorage.removeItem(STORAGE_KEYS.ZK_PROOF);
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  return { login, logout };
}
