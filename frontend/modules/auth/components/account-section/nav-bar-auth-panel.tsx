'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Circle } from 'lucide-react';
import { useUser, useAuthActions } from '@/providers/AppProvider';

export const NavBarAuthPanel: React.FC = () => {
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
    <div className="relative hidden items-center md:flex" ref={panelRef}>
      <div
        className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition-all duration-150 ${open ? 'bg-[#9e77ed80]/50 shadow-md' : 'bg-white'} hover:bg-[#9e77ed80]/50 hover:shadow-md`}
        onClick={() => setOpen((v) => !v)}
      >
        <img src={user.avatar} alt="avatar" className="h-10 w-10 rounded-full border" width={32} height={32} />
        <span className="text-md max-w-[120px] truncate font-medium">{user.username || user.email}</span>
      </div>
      {open && (
        <div className="absolute top-12 right-0 z-50 flex min-w-[220px] flex-col gap-2 rounded-lg border bg-white p-4 shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full" width={32} height={32} />
            <div>
              <div className="text-sm font-semibold">{user.username || user.email}</div>
              <div className="text-xs text-gray-500">ID: {user.id}</div>
            </div>
          </div>
          <div className="mb-2 text-xs break-all text-gray-700">
            <span className="font-medium">Wallet:</span> {user.walletAddress || 'N/A'}
          </div>
          <Button size="sm" variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      )}
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
