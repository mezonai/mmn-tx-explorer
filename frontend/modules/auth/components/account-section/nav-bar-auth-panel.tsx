'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRightToLine } from 'lucide-react';
import { useUser, useAuthActions } from '@/providers/AppProvider';
import { cn } from '@/lib/utils';
import { CopyButton } from '@/components/ui/copy-button';

export const NavBarAuthPanel: React.FC = () => {
  const { user } = useUser();
  const { login, logout } = useAuthActions();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const classname = cn(
    'hover:bg-brand-primary-background flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition-all duration-150 hover:shadow-md',
    open ? 'bg-brand-primary-background' : 'bg-background'
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
    <div className="relative hidden items-center md:flex" ref={panelRef}>
      <div className={classname} onClick={() => setOpen((v) => !v)}>
        <img src={user.avatar} alt="avatar" className="h-10 w-10 rounded-full border" width={32} height={32} />
        <span className="text-md max-w-[120px] truncate font-medium">{user.username || user.email}</span>
      </div>
      {open && (
        <div className="bg-background absolute top-12 right-0 z-50 flex size-56 flex-col gap-2 rounded-lg border p-4 shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full" width={32} height={32} />
            <div>
              <div className="text-sm font-semibold">{user.username || user.email}</div>
              <div className="text-xs text-gray-500">ID: {user.id}</div>
            </div>
          </div>
          <div className="mb-2 flex flex-col gap-1 text-xs text-gray-700">
            <div className="flex items-center gap-x-0.5 gap-y-2 break-all">
              <span className="font-medium">Wallet:</span>
              <span className="rounded py-0.5 text-gray-800">
                {user.walletAddress ? `${user.walletAddress.slice(0, 3)}...${user.walletAddress.slice(-4)}` : 'N/A'}
              </span>
              {user.walletAddress && <CopyButton textToCopy={user.walletAddress} className="ml-2" />}
            </div>
            {user.email && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span className="truncate">{user.email}</span>
              </div>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={logout}>
            Logout
          </Button>
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
