'use client';

import { STORAGE_KEYS } from '@/constant';
import {
  AUTHENTICATION_ENDPOINT,
  AuthenticationService,
  createLightClient,
  fetchAndStoreZkProof,
  generateAndStoreKeyPair,
  generateCsrfToken,
  handleTokenStorage,
  LoginResponse,
  mmnClient,
  processAndStoreUser,
} from '@/modules/auth';
import axios from 'axios';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { IZkProof, IEphemeralKeyPair } from 'mmn-client-js';
import { safeJsonParse, clearAuthStorage } from '@/utils';
import { useWebSocket } from '@/lib/websocket/useWebSocket';
import { LightClient } from 'mezon-light-sdk';
import { serverkey } from '../service/index';
interface AppContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  zkProof: IZkProof | null;
  setZkProof: (zk: IZkProof | null) => void;
  keypair: IEphemeralKeyPair | null;
  setKeypair: (keypair: IEphemeralKeyPair | null) => void;
  lightClient: LightClient | null;
  setLightClient: (lc: LightClient | null) => void;
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
  const [lightClient, setLightClient] = useState<LightClient | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const wsManager = useWebSocket();
  const resetSession = () => {
    clearAuthStorage();
    setUser(null);
    setZkProof(null);
    setKeypair(null);
    setLightClient(null);
    setIsAuthenticated(false);
  };
  useEffect(() => {
    const localTokenStr = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const localToken = localTokenStr ? safeJsonParse(localTokenStr) : null;

    const lightClientStr = localStorage.getItem(STORAGE_KEYS.LIGHT_CLIENT);
    const lightClient = lightClientStr ? safeJsonParse(lightClientStr) : null;

    if (lightClient) {
      (async () => {
        try {
          const light_client = LightClient.initClient({
            token: lightClient._session.token,
            refresh_token: lightClient._session.refresh_token,
            api_url: lightClient._session.api_url,
            user_id: lightClient._userId,
            serverkey,
          });
          setLightClient(light_client);
        } catch (err) {
          console.error(err);
          resetSession();
          toast.error('Session expired, please log in again.');
        }
      })();
    }

    const userStored = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (userStored && localToken) {
      const tokenData = safeJsonParse<{ access_token?: string }>(localStorage.getItem(STORAGE_KEYS.TOKEN));
      if (tokenData?.access_token) {
        wsManager.connect(tokenData.access_token);
      }

      const u = safeJsonParse(userStored);
      setUser(u);
      setIsAuthenticated(true);

      const zkStr = localStorage.getItem(STORAGE_KEYS.ZK_PROOF);
      if (zkStr) setZkProof(safeJsonParse(zkStr));

      const kpStr = localStorage.getItem(STORAGE_KEYS.KEY_PAIR);
      if (kpStr) setKeypair(safeJsonParse(kpStr));

      return;
    }
    const code = searchParams.get('authCode');

    if (!code) {
      return;
    }

    const handleAuthentication = async (authCode: string) => {
      try {
        const userInfo: LoginResponse = await AuthenticationService.getUserInfo(authCode);
        setIsAuthenticated(true);
        handleTokenStorage(userInfo);
        const keypair = generateAndStoreKeyPair();
        setKeypair(keypair);
        const senderAddress = mmnClient.getAddressFromUserId(userInfo.user.user_id);
        const userObject = processAndStoreUser(userInfo.user, senderAddress);
        setUser(userObject);
        const light_client = await createLightClient(
          userInfo.auth_token,
          userInfo.user.user_id,
          userInfo.user.username,
          serverkey
        );
        if (light_client) {
          setLightClient(light_client);
        }
        const fetchedZk = await fetchAndStoreZkProof(
          userInfo.user.user_id || userInfo.user.sub,
          keypair.publicKey,
          userInfo.auth_token,
          senderAddress
        );
        if (fetchedZk) {
          setZkProof(fetchedZk);
        }

        if (userInfo.access_token) {
          wsManager.connect(userInfo.access_token);
        }
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.delete('authCode');
        const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
        router.replace(newUrl);
        toast.success('Login successful!');
      } catch {
        resetSession();
        toast.error('Login failed!');
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
    lightClient,
    setLightClient,
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
export function useLightClient() {
  const { lightClient, setLightClient } = useApp();
  return { lightClient, setLightClient };
}
export function useAuthActions() {
  const { setIsAuthenticated, setUser, setZkProof, setKeypair, setLightClient } = useApp();
  const login = () => {
    const csrfToken = generateCsrfToken();
    const currentPath = location.pathname + location.search;
    const stateObject = {
      csrf: csrfToken,
      redirect_url: currentPath,
    };
    const encodedState = Buffer.from(JSON.stringify(stateObject)).toString('base64');
    window.location.href = `${AUTHENTICATION_ENDPOINT.LOGIN}?state=${encodedState}`;
  };

  const logout = () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const refreshToken = token ? safeJsonParse(token).refresh_token : null;
    if (refreshToken) {
      axios.post(AUTHENTICATION_ENDPOINT.LOGOUT, { refresh_token: refreshToken });
    }
    clearAuthStorage();
    setUser(null);
    setLightClient(null);
    setZkProof(null);
    setKeypair(null);
    setIsAuthenticated(false);
  };

  return { login, logout };
}
