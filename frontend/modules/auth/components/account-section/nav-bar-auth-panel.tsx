'use client';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticationService } from '@/modules/auth/api';
import type { LoginResponse } from '@/modules/auth/type';
import { MmnClient, ZkClient } from 'mmn-client-js';
import { Circle } from 'lucide-react';
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

export const NavBarAuthPanel: React.FC = () => {
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
    <div className={'hidden items-center gap-2 md:flex'}>
      <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full" width={32} height={32} />
      <span className="max-w-[120px] truncate">{user.username || user.email}</span>
      <Button size="sm" variant="outline" onClick={logout}>
        Logout
      </Button>
    </div>
  ) : (
    <Button className={'hidden md:flex'} onClick={login}>
      <span className="flex items-center gap-2">
        <Circle />
        Login with Mezon
      </span>
    </Button>
  );
};
