'use client';
import { Button } from '@/components/ui/button';
import { Circle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useUser, useAuthActions } from '@/providers/AppProvider';

export const SidebarAuthPanel = () => {
  const { user } = useUser();
  const { login, logout } = useAuthActions();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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
      <div
        className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition-all duration-150 ${open ? 'bg-violet-100 shadow-md' : 'bg-white'} hover:border-violet-400 hover:bg-violet-100 hover:shadow-md`}
        onClick={() => setOpen((v) => !v)}
      >
        {user.avatar && (
          <img src={user.avatar} alt="avatar" className="h-10 w-10 rounded-full border" width={40} height={40} />
        )}
        <span className="max-w-[120px] truncate text-base font-medium">{user.username || user.email}</span>
      </div>
      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 flex min-w-[220px] -translate-x-1/2 flex-col gap-2 rounded-lg border bg-white p-4 shadow-lg">
          <div className="mb-2 flex items-center justify-center gap-2">
            {user.avatar && (
              <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full" width={32} height={32} />
            )}
            <div>
              <div className="text-sm font-semibold">{user.username || user.email}</div>
              <div className="text-xs text-gray-500">ID: {user.id}</div>
            </div>
          </div>
          <div className="mb-2 text-center text-xs break-all text-gray-700">
            <span className="font-medium">Wallet:</span> {user.walletAddress || 'N/A'}
          </div>
          <Button size="sm" variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      )}
    </div>
  ) : (
    <Button onClick={login} className="mt-4 w-full">
      <Circle className="mr-2" />
      Login with Mezon
    </Button>
  );
};
