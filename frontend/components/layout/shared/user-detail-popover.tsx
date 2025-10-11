'use client';
import * as React from 'react';
import Image from 'next/image';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

interface User {
  avatar?: string;
  display_name?: string;
  username?: string;
  [key: string]: unknown;
}

interface UserDetailPopoverProps {
  user: User;
  showSensitive: Record<string, boolean>;
  setShowSensitive: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  copiedKey: string | null;
  setCopiedKey: React.Dispatch<React.SetStateAction<string | null>>;
  popoverPos: { top: number; left: number };
}

export const UserDetailPopover: React.FC<UserDetailPopoverProps> = ({
  user,
  showSensitive,
  setShowSensitive,
  copiedKey,
  setCopiedKey,
  popoverPos,
}) => {
  return (
    <div
      className="animate-fade-in fixed z-[9999] rounded-xl border border-gray-200 bg-white p-0 shadow-2xl"
      style={{
        top: popoverPos.top,
        left: popoverPos.left,
        boxShadow: '0 4px 24px #0002',
        minWidth: 320,
        maxWidth: 400,
        width: 320,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative flex h-20 w-full items-end justify-center rounded-t-xl bg-violet-100">
        <Image
          src={user.avatar || '/default-avatar.png'}
          alt="avatar"
          width={72}
          height={72}
          className="absolute -bottom-9 left-1/2 -translate-x-1/2 rounded-full border-4 border-white shadow"
        />
      </div>
      <div className="x-6 pt-12 pb-4">
        <div className="mb-2 flex flex-col items-center">
          <span className="text-lg font-bold text-gray-900">{String(user.display_name) || 'User'}</span>
          <span className="text-sm text-gray-500">{String(user.username)}</span>
        </div>
        {typeof user.email === 'string' && user.email && (
          <div className="mb-2 text-center text-xs text-gray-600">{user.email}</div>
        )}
        <div className="rounded-lg bg-gray-50 p-1" style={{ width: '100%', marginBottom: 0 }}>
          {['auth_time', 'mezon_id', 'user_id', 'aud'].map((key) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-xs font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs text-gray-700">
                  {showSensitive[key]
                    ? key === 'aud'
                      ? Array.isArray(user[key])
                        ? String((user[key] as string[]).join(', '))
                        : String(user[key] ?? '')
                      : String(user[key] ?? '')
                    : '••••••••'}
                </span>
                <button
                  className="ml-1 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowSensitive((s) => ({ ...s, [key]: !s[key] }))}
                  title={showSensitive[key] ? 'Ẩn' : 'Hiện'}
                >
                  {showSensitive[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  className="ml-1 text-gray-400 hover:text-gray-700"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      key === 'aud'
                        ? Array.isArray(user[key])
                          ? (user[key] as string[]).join(', ')
                          : String(user[key])
                        : String(user[key])
                    );
                    setCopiedKey(key);
                    setTimeout(() => setCopiedKey(null), 1000);
                  }}
                  title="Copy"
                >
                  {copiedKey === key ? <Check size={17} className="text-green-600" /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
