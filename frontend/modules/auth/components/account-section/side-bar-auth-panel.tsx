'use client';
import { SidebarContent, SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Circle } from 'lucide-react';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticationService } from '@/modules/auth/api';
import type { LoginResponse } from '@/modules/auth/type';
import axios from 'axios';
import { MmnClient, ZkClient } from 'mmn-client-js';
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
export const SidebarAuthPanel = () => {
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
        const keypair = mmnClient.generateEphemeralKeyPair();
        localStorage.setItem('key_pair', JSON.stringify(keypair));
        const senderAddress = mmnClient.getAddressFromUserId(userInfo.user.user_id);
        setUser({
          id: userInfo.user.user_id,
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
    <SidebarContent className="px-2 py-4">
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full items-center gap-2 pl-3">
            {user.avatar && <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full" />}
            <span className="flex-1 truncate">{user.username || user.email}</span>
          </div>
          <Button
            className="mt-3 w-full"
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
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  ) : (
    <Button onClick={mezonLogin}>
      <Circle />
      Login with Mezon
    </Button>
  );
};
