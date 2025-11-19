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

export const NavBarAuthPanel: React.FC = () => {
  const { user } = useUser();
  const { login, logout } = useAuthActions();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const classname = cn(
    'flex cursor-pointer items-center space-x-2 rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 transition',
    open ? 'bg-gray-50 dark:bg-card' : 'bg-background hover:bg-gray-50 dark:hover:bg-card'
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
      <button
        className={classname}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <img
          src={user.avatar}
          alt="User Avatar"
          className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 object-cover"
        />
        <span className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</span>
        <i className={cn("fa-solid fa-chevron-down text-gray-400 text-xs transition-transform", open && "rotate-180")}></i>
      </button>
      {renderPanel && (
        <div
          role="menu"
          aria-label="Profile menu"
          className={cn(
            'absolute right-0 mt-2 top-full w-80 bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-2xl shadow-xl p-4 space-y-4 z-50 origin-top-right transform transition-all duration-150 ease-out',
            entering ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'
          )}
        >
          <div className="flex items-center space-x-3 border-b border-gray-300 dark:border-gray-700 pb-3">
            <img
              src={user.avatar}
              alt="User Avatar"
              className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{user.username}</h3>
                <span className="text-green-400 text-xs">● Online</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs flex items-center gap-2">
                <span>ID:</span>
                <span className="font-mono text-gray-900 dark:text-gray-300">{user.id}</span>
                <CopyButton textToCopy={String(user.id)} className="!size-4" />
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Wallet</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-gray-900 dark:text-gray-200 text-sm">
                  {user.walletAddress ? `${user.walletAddress.slice(0, 3)}...${user.walletAddress.slice(-4)}` : 'N/A'}
                </span>
                {user.walletAddress && <CopyButton textToCopy={user.walletAddress} className="ml-1" />}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Network</span>
              <span className="text-gray-900 dark:text-gray-200 flex items-center space-x-1">
                <i className="fa-solid fa-globe text-xs"></i>
                <span>{APP_CONFIG.CHAIN_NAME}</span>
              </span>
            </div>
            {user.email && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Email</span>
                <span className="text-gray-900 dark:text-gray-200 text-xs truncate max-w-[180px]">{user.email}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-300 dark:border-gray-700"></div>

          <div className="space-y-1 text-sm">
            <a
              href={user.walletAddress ? ROUTES.WALLET(user.walletAddress) : ROUTES.PROFILE}
              className="group cursor-pointer flex w-full items-center justify-between px-3 py-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <i className="fa-solid fa-wallet text-[var(--color-brand-primary)] w-4 text-center"></i>
                <span className="transition-colors">Account Overview</span>
              </span>
              <i className="fa-solid fa-chevron-right text-gray-500 text-xs transition-all group-hover:translate-x-0.5"></i>
            </a>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="group cursor-pointer flex w-full items-center justify-between px-3 py-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <i className={cn("text-[var(--color-brand-primary)] w-4 text-center", theme === 'dark' ? "fa-solid fa-moon" : "fa-solid fa-sun")}></i>
                <span className="transition-colors">Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </span>
              <i className="fa-solid fa-chevron-right text-gray-500 text-xs transition-all group-hover:translate-x-0.5"></i>
            </button>
          </div>

          <div className="border-t border-gray-300 dark:border-gray-700"></div>
          <button
            onClick={logout}
            className="w-full cursor-pointer bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/20 py-2 rounded-lg font-semibold text-sm transition"
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
