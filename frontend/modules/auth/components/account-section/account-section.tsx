import { SidebarContent, SidebarGroup, SidebarGroupContent, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Circle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticationService } from '@/modules/auth/api';
import type { LoginResponse, UserInfo } from '@/modules/auth/type';
import axios from 'axios';
import { MmnClient, ZkClient } from 'mmn-client-js';

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
  const { state } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<Pick<UserInfo, 'avatar' | 'username' | 'email'> | null>(null);
  const code = searchParams.get('code');

  const mezonLogin = () => {
    window.location.href = '/oauth2/login';
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!code) return;
    const fetchUserInfo = async () => {
      try {
        router.replace('/');
        const userInfo: LoginResponse = await AuthenticationService.getUserInfo(code);
        setUser(userInfo.user);
        localStorage.setItem('access_token', userInfo.access_token);
        localStorage.setItem('auth_token', userInfo.auth_token);
        localStorage.setItem('refresh_token', userInfo.refresh_token);
        localStorage.setItem('user', JSON.stringify(userInfo.user));
        const keypair = mmnClient.generateEphemeralKeyPair();
        localStorage.setItem('key_pair', JSON.stringify(keypair));
        const senderAddress = mmnClient.getAddressFromUserId(userInfo.user.user_id);
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
  }, [code, router]);

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
      {state === 'collapsed' ? (
        <Circle className="h-10 w-10" />
      ) : (
        <>
          <Circle />
          Login with Mezon
        </>
      )}
    </Button>
  );
};
