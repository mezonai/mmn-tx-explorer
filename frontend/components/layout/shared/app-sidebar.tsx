'use client';

import Link from 'next/link';

import { ChevronLeft } from '@/assets/icons';
import { AppLogo } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ROUTES } from '@/configs/routes.config';
import { cn } from '@/lib/utils';
import { sidebarNavItems } from '../navigation/nav-items';
import { AppSidebarItem } from './app-sidebar-item';
import { Circle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MmnClient } from 'mmn-client-js';
export function AppSidebar() {
  const { toggleSidebar, state } = useSidebar();
  const [user, setUser] = useState(null);
  const [userid, setUserid] = useState(null);
  const mmnURL = process.env.NEXT_PUBLIC_CHAT_APP_MMN_API_URL ?? '';
  const [loading, setLoading] = useState(true);
  const logoutItem = sidebarNavItems.find((item) => item.title === 'Log Out');
  const mmnClient = new MmnClient({
    baseUrl: mmnURL,
  });
  const mezonLogin = () => {
    window.location.href = '/oauth2/login';
  };
  const mezonLogout = () => {
    window.location.href = '/oauth2/logout';
    setUser(null);
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/oauth2/userinfo');
        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          console.log(data);
          setUserid(data.user_id);
          setUser(data);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="relative px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={ROUTES.HOME}>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="pointer-events-none absolute top-1/2 right-0 hidden translate-x-1/2 -translate-y-1/2 md:block md:opacity-0 md:transition-opacity md:group-hover:pointer-events-auto md:group-hover:opacity-100">
          <Button variant="outline" size="icon" className="aspect-square size-fit p-1.5" onClick={toggleSidebar}>
            <ChevronLeft
              className={cn(
                'text-foreground-quaternary-400 size-4 transition-transform',
                state === 'collapsed' && 'rotate-180'
              )}
            />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarNavItems.map((item) => (
                <AppSidebarItem key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {loading ? (
          <Button disabled>Loading</Button>
        ) : user ? (
          <SidebarContent className="px-2 py-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="flex w-full items-center gap-2 pl-3">
                  {user.avatar && <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full" />}
                  <span className="flex-1 truncate">{user.name || user.username || user.email}</span>
                </div>
                <SidebarMenu>
                  <AppSidebarItem key={logoutItem!.href} item={logoutItem!} />
                </SidebarMenu>
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
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
