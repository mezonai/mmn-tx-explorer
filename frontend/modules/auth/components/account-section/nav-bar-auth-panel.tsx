'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRightToLine } from 'lucide-react';
import { useUser, useAuthActions } from '@/providers/AppProvider';
import { cn } from '@/lib/utils';
import { CopyButton } from '@/components/ui/copy-button';
import { APP_CONFIG } from '@/configs/app.config';
import { useTheme } from '@/providers/ThemeProvider';
import { ROUTES } from '@/configs/routes.config';
import { STORAGE_KEYS } from '@/constant';

export const NavBarAuthPanel: React.FC = () => {
  const { user } = useUser();
  const { login, logout } = useAuthActions();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const classname = cn(
    'flex cursor-pointer items-center space-x-2 rounded-xl border border-gray-300 px-4 py-2 transition dark:border-gray-700',
    open ? 'dark:bg-card bg-gray-50' : 'bg-background dark:hover:bg-card hover:bg-gray-50'
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

  const [entering, setEntering] = useState(false);
  const [renderPanel, setRenderPanel] = useState(false);
  useEffect(() => {
    let timeout: number | undefined;
    if (open) {
      setRenderPanel(true);
      requestAnimationFrame(() => setEntering(true));
    } else {
      setEntering(false);
      timeout = window.setTimeout(() => setRenderPanel(false), 150);
    }
    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [open]);

  return user ? (
    <div className="relative hidden items-center md:flex" ref={panelRef}>
      <button className={classname} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <img
          src={user.avatar}
          alt="User Avatar"
          className="h-8 w-8 rounded-full border border-gray-300 object-cover dark:border-gray-600"
        />
        <span className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</span>
        <i
          className={cn('fa-solid fa-chevron-down text-xs text-gray-400 transition-transform', open && 'rotate-180')}
        ></i>
      </button>
      {renderPanel && (
        <div
          role="menu"
          aria-label="Profile menu"
          className={cn(
            'absolute top-full right-0 z-50 mt-2 w-80 origin-top-right transform space-y-4 rounded-2xl border border-gray-300 bg-white p-4 shadow-xl transition-all duration-150 ease-out dark:border-gray-700 dark:bg-[#1e293b]',
            entering ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-1 scale-95 opacity-0'
          )}
        >
          <div className="flex items-center space-x-3 border-b border-gray-300 pb-3 dark:border-gray-700">
            <img
              src={user.avatar}
              alt="User Avatar"
              className="h-10 w-10 rounded-full border border-gray-300 object-cover dark:border-gray-600"
            />
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
                <i className="fa-solid fa-globe text-xs"></i>
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
                <i className="fa-solid fa-wallet w-4 text-center text-[var(--color-brand-primary)]"></i>
                <span className="transition-colors">Account Overview</span>
              </span>
              <i className="fa-solid fa-chevron-right text-xs text-gray-500 transition-all group-hover:translate-x-0.5"></i>
            </a>
            <a
              href={ROUTES.DONATION_CAMPAIGN}
              onClick={(e) => {
                e.preventDefault();
                sessionStorage.setItem(STORAGE_KEYS.SHOW_MINE_CAMPAIGNS, 'true');
                window.location.href = ROUTES.DONATION_CAMPAIGN;
              }}
              className="group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
            >
              <span className="flex items-center space-x-2">
                <i className="fa-solid fa-bullhorn w-4 text-center text-[var(--color-brand-primary)]"></i>
                <span className="transition-colors">My Campaigns</span>
              </span>
              <i className="fa-solid fa-chevron-right text-xs text-gray-500 transition-all group-hover:translate-x-0.5"></i>
            </a>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
            >
              <span className="flex items-center space-x-2">
                <i
                  className={cn(
                    'w-4 text-center text-[var(--color-brand-primary)]',
                    theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'
                  )}
                ></i>
                <span className="transition-colors">Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </span>
              <i className="fa-solid fa-chevron-right text-xs text-gray-500 transition-all group-hover:translate-x-0.5"></i>
            </button>
          </div>

          <div className="border-t border-gray-300 dark:border-gray-700"></div>
          <button
            onClick={logout}
            className="w-full cursor-pointer rounded-lg border border-red-500/40 bg-transparent py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            <i className="fa-solid fa-right-from-bracket mr-2"></i> Logout
          </button>
        </div>
      )}
    </div>
  ) : (
    <Button onClick={login} className={'bg-brand-primary hidden rounded-lg font-semibold text-white shadow-xs md:flex'}>
      <>
        <span>Login with Mezon</span>
        <ArrowRightToLine />
      </>
    </Button>
  );
};
