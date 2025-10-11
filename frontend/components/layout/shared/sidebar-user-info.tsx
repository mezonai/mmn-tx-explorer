'use client';
interface User {
  avatar?: string;
  display_name?: string;
  username?: string;
  [key: string]: unknown;
}
import * as React from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { UserDetailPopover } from './user-detail-popover';

export function SidebarUserInfo() {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [showSensitive, setShowSensitive] = React.useState<Record<string, boolean>>({});
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const [popoverPos, setPopoverPos] = React.useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    fetch('/api/me/user')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data && !data.error ? data : null);
        setLoading(false);
      });
  }, [mounted]);

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };
  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    setUser(null);
    window.location.href = '/';
  };

  const handleUserInfoClick = (e: React.MouseEvent) => {
    setShowModal((v) => {
      if (!v) {
        const rect = (e.target as HTMLElement).closest('button')?.getBoundingClientRect();
        if (rect) {
          setPopoverPos({
            top: rect.top - 350,
            left: rect.left + rect.width / 2 - 120,
          });
        }
      }
      return !v;
    });
  };

  if (!mounted || loading) {
    return <div className="p-4 text-sm text-gray-400">Loading...</div>;
  }
  return (
    <div className="relative flex flex-col items-center gap-2 border-t border-gray-200 p-4">
      {user ? (
        <>
          <button
            className="flex w-full items-center gap-2 rounded p-2 hover:bg-gray-100"
            onClick={handleUserInfoClick}
            style={{ cursor: 'pointer' }}
          >
            <Image
              src={user.avatar || '/default-avatar.png'}
              alt="avatar"
              width={40}
              height={40}
              className="rounded-full border-2 border-white shadow"
            />
            <span className="truncate text-base font-semibold">{user.display_name || user.username || 'User'}</span>
          </button>
          {showModal &&
            popoverPos &&
            mounted &&
            typeof window !== 'undefined' &&
            createPortal(
              <UserDetailPopover
                user={user}
                showSensitive={showSensitive}
                setShowSensitive={setShowSensitive}
                copiedKey={copiedKey}
                setCopiedKey={setCopiedKey}
                popoverPos={popoverPos}
              />,
              window.document.body
            )}
          <button
            onClick={handleLogout}
            className="mt-2 w-full cursor-pointer rounded bg-gradient-to-r from-purple-500 to-purple-700 py-1.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:scale-[1.04] hover:shadow-lg focus:ring-2 focus:ring-purple-400 focus:outline-none active:scale-95"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={handleLogin}
          className="w-full cursor-pointer rounded bg-gradient-to-r from-purple-500 to-purple-700 py-1.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:scale-[1.04] hover:shadow-lg focus:ring-2 focus:ring-purple-400 focus:outline-none active:scale-95"
        >
          Login with Mezon
        </button>
      )}
    </div>
  );
}
