'use client';
import { SidebarContent, SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Circle } from 'lucide-react';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticationService } from '@/modules/auth/api';
import type { LoginResponse } from '@/modules/auth/type';
import { MmnClient, ZkClient } from 'mmn-client-js';
import { useUser, useAuth, useAuthActions } from '@/providers/AppProvider';

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
  const { login, logout } = useAuthActions();

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
          <Button className="mt-3 w-full" variant="outline" onClick={logout}>
            Logout
          </Button>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  ) : (
    <Button onClick={login}>
      <Circle />
      Login with Mezon
    </Button>
  );
};
