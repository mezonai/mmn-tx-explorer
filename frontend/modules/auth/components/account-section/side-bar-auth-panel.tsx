'use client';
import { Button } from '@/components/ui/button';
import { ArrowRightToLine } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useUser, useAuthActions } from '@/providers/AppProvider';
import { cn } from '@/lib/utils';
import { CopyButton } from '@/components/ui/copy-button';
import { ROUTES } from '@/configs/routes.config';
import { APP_CONFIG } from '@/configs/app.config';
import { useTheme } from '@/providers/ThemeProvider';
import { STORAGE_KEYS } from '@/constant';
import { Globe, Megaphone, Moon, Sun, LogOut } from 'lucide-react';
import { Wallet02, ChevronRight } from '@/assets/icons';

export const SidebarAuthPanel = () => {
  const { user } = useUser();
  const { login, logout } = useAuthActions();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const classname = cn(
    'hover:bg-brand-primary-background dark:hover:bg-card flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition-all duration-150 hover:shadow-md',
    open ? 'bg-brand-primary-background' : 'bg-background',
    open ? 'dark:bg-card' : 'bg-background'
  );
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return user ? (
    <div className="relative" ref={panelRef}>
      <div className={classname} onClick={() => setOpen((v) => !v)}>
        {user.avatar && (
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border">
            <img src={user.avatar} alt="avatar" className="h-full w-full object-cover object-center" />
          </div>
        )}
        <span className="max-w-[120px] truncate text-base font-medium">{user.username}</span>
      </div>
      {open && (
        <div className="bg-background absolute bottom-full left-4 z-50 mb-2 flex w-80 flex-col gap-2 rounded-2xl border p-4 shadow-xl">
          <div className="flex items-center space-x-3 border-b border-gray-300 pb-3 dark:border-gray-700">
            {user.avatar && (
              <img
                src={user.avatar}
                alt="User Avatar"
                className="h-10 w-10 rounded-full border border-gray-300 object-cover dark:border-gray-600"
              />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{user.username}</h3>
                <span className="text-xs text-green-400">● Online</span>
              </div>
              <p className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>ID:</span>
                <span className="font-mono text-gray-900 dark:text-gray-300">{user.id}</span>
                <CopyButton textToCopy={String(user.id)} className="!size-4" />
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Wallet</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-900 dark:text-gray-200">
                  {user.walletAddress ? `${user.walletAddress.slice(0, 3)}...${user.walletAddress.slice(-4)}` : 'N/A'}
                </span>
                {user.walletAddress && <CopyButton textToCopy={user.walletAddress} className="ml-1" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Network</span>
              <span className="flex items-center space-x-1 text-gray-900 dark:text-gray-200">
                <Globe className="h-4 w-4" />
                <span>{APP_CONFIG.CHAIN_NAME}</span>
              </span>
            </div>

            {user.email && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email</span>
                <span className="max-w-[180px] truncate text-xs text-gray-900 dark:text-gray-200">{user.email}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-300 dark:border-gray-700"></div>

          <div className="space-y-1 text-sm">
            <a
              href={user.walletAddress ? ROUTES.WALLET(user.walletAddress) : ROUTES.PROFILE}
              className="group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
            >
              <span className="flex items-center space-x-2">
                <Wallet02 className="text-brand-primary h-4 w-4" />
                <span className="font-medium transition-colors">Account Overview</span>
              </span>
              <ChevronRight className="h-4 w-4 text-gray-500 transition-all group-hover:translate-x-0.5" />
            </a>
            <Button
              variant="ghost"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem(STORAGE_KEYS.SHOW_MINE_CAMPAIGNS, 'true');
                  window.location.href = ROUTES.DONATION_CAMPAIGN;
                }
              }}
              className="group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
            >
              <span className="flex items-center space-x-2">
                <Megaphone className="text-brand-primary h-4 w-4" />
                <span className="transition-colors">My Campaigns</span>
              </span>
              <ChevronRight className="h-4 w-4 text-gray-500 transition-all group-hover:translate-x-0.5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
            >
              <span className="flex items-center space-x-2">
                {theme === 'dark' ? (
                  <Sun className="text-brand-primary h-4 w-4" />
                ) : (
                  <Moon className="text-brand-primary h-4 w-4" />
                )}

                <span className="transition-colors">Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </span>
              <ChevronRight className="h-4 w-4 text-gray-500 transition-all group-hover:translate-x-0.5" />
            </Button>
          </div>

          <div className="border-t border-gray-300 dark:border-gray-700"></div>
          <Button
            onClick={logout}
            className="w-full cursor-pointer rounded-lg border border-red-500/40 bg-transparent py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            <LogOut className="mr-2 inline-block h-4 w-4" />
            Logout
          </Button>
        </div>
      )}
    </div>
  ) : (
    <Button
      onClick={login}
      className={'bg-brand-primary hover:bg-brand-primary/90 rounded-lg font-semibold text-white shadow-xs'}
    >
      <>
        <span>Login with Mezon</span>
        <ArrowRightToLine />
      </>
    </Button>
  );
};
