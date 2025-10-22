'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Circle } from 'lucide-react';
import { useUser, useAuthActions } from '@/providers/AppProvider';

export const NavBarAuthPanel: React.FC = () => {
  const { user } = useUser();
  const { login, logout } = useAuthActions();
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
