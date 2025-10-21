'use client';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticationService } from '@/modules/auth/api';
import type { LoginResponse } from '@/modules/auth/type';
import axios from 'axios';
import { MmnClient, ZkClient } from 'mmn-client-js';
import { Circle } from 'lucide-react';
import { useUser, useAuth } from '@/providers/AppProvider';

const mmnURL = process.env.NEXT_PUBLIC_CHAT_APP_MMN_API_URL ?? '';
const zkURL = process.env.NEXT_PUBLIC_CHAT_APP_ZK_API_URL ?? '';
export const mmnClient = new MmnClient({
  baseUrl: mmnURL,
});
export const zkClient = new ZkClient({
  endpoint: zkURL,
  timeout: 30000,
});

interface NavBarAuthPanelProps {
  className?: string;
}

export const NavBarAuthPanel: React.FC<NavBarAuthPanelProps> = ({ className = '' }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useUser();
  const { setIsAuthenticated } = useAuth();
  const code = searchParams.get('code');

  const mezonLogin = () => {
    window.location.href = '/oauth2/login';
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored && !user) {
      try {
        setUser(JSON.parse(stored));
        setIsAuthenticated(true);
      } catch {}
    }
  }, [setUser, setIsAuthenticated, user]);

  useEffect(() => {
    if (!code) return;
    const fetchUserInfo = async () => {
      try {
        router.replace('/');
        const userInfo: LoginResponse = await AuthenticationService.getUserInfo(code);

        setIsAuthenticated(true);
        localStorage.setItem('access_token', userInfo.access_token);
        localStorage.setItem('auth_token', userInfo.auth_token);
        localStorage.setItem('refresh_token', userInfo.refresh_token);
        localStorage.setItem('user', JSON.stringify(userInfo.user));
        const keypair = mmnClient.generateEphemeralKeyPair();
        localStorage.setItem('key_pair', JSON.stringify(keypair));
        const senderAddress = mmnClient.getAddressFromUserId(userInfo.user.user_id);
        setUser({
          id: userInfo.user.user_id || userInfo.user.sub,
          username: userInfo.user.username || userInfo.user.display_name || '',
          email: userInfo.user.email,
          avatar: userInfo.user.avatar,
          walletAdress: senderAddress,
        });
        const zkProof = await zkClient.getZkProofs({
          userId: userInfo.user.user_id,
          ephemeralPublicKey: keypair.publicKey,
          jwt: userInfo.auth_token,
          address: senderAddress,
        });
        localStorage.setItem('zkProof', JSON.stringify(zkProof.proof));
      } catch (error) {
        console.error(error);
      }
    };
    fetchUserInfo();
  }, [code, router, setIsAuthenticated, setUser]);

  return user ? (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full" width={32} height={32} />
      <span className="max-w-[120px] truncate">{user.username || user.email}</span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
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
        }}
      >
        Logout
      </Button>
    </div>
  ) : (
    <Button className={className} onClick={mezonLogin}>
      <span className="flex items-center gap-2">
        <Circle />
        Login with Mezon
      </span>
    </Button>
  );
};
