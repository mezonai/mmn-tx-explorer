'use client';
import { SidebarContent, SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Circle } from 'lucide-react';
import React from 'react';
import { useUser, useAuthActions } from '@/providers/AppProvider';

export const SidebarAuthPanel = () => {
  const { user } = useUser();
  const { login, logout } = useAuthActions();
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
