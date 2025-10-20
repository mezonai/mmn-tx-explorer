'use client';
import * as React from 'react';
import Image from 'next/image';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

interface User {
  aud?: string[];
  auth_time?: number;
  avatar?: string;
  display_name?: string;
  email?: string;
  iat?: number;
  iss?: string;
  mezon_id?: string;
  rat?: number;
  sub?: string;
  user_id?: string;
  username?: string;
}

interface UserDetailPopoverProps {
  user: User;
  copiedKey: string | null;
  setCopiedKey: React.Dispatch<React.SetStateAction<string | null>>;
  popoverPos: { top: number; left: number };
}

export const UserDetailPopover: React.FC<UserDetailPopoverProps> = ({ user, copiedKey, setCopiedKey, popoverPos }) => {
  const [showAuthTime, setShowAuthTime] = React.useState(false);
  const [showMezonId, setShowMezonId] = React.useState(false);
  const [showUserId, setShowUserId] = React.useState(false);
  const [showAud, setShowAud] = React.useState(false);

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
          width={100}
          height={100}
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
          {/* auth_time */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-gray-500 capitalize">Auth time</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-gray-700">
                {showAuthTime ? String(user.auth_time ?? '') : '••••••••'}
              </span>
              <button
                className="ml-1 text-gray-400 hover:text-gray-700"
                onClick={() => setShowAuthTime((v) => !v)}
                title={showAuthTime ? 'Ẩn' : 'Hiện'}
              >
                {showAuthTime ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                className="ml-1 text-gray-400 hover:text-gray-700"
                onClick={() => {
                  navigator.clipboard.writeText(String(user.auth_time ?? ''));
                  setCopiedKey('auth_time');
                  setTimeout(() => setCopiedKey(null), 1000);
                }}
                title="Copy"
              >
                {copiedKey === 'auth_time' ? <Check size={17} className="text-green-600" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {/* mezon_id */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-gray-500 capitalize">Mezon ID</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-gray-700">
                {showMezonId ? String(user.mezon_id ?? '') : '••••••••'}
              </span>
              <button
                className="ml-1 text-gray-400 hover:text-gray-700"
                onClick={() => setShowMezonId((v) => !v)}
                title={showMezonId ? 'Ẩn' : 'Hiện'}
              >
                {showMezonId ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                className="ml-1 text-gray-400 hover:text-gray-700"
                onClick={() => {
                  navigator.clipboard.writeText(String(user.mezon_id ?? ''));
                  setCopiedKey('mezon_id');
                  setTimeout(() => setCopiedKey(null), 1000);
                }}
                title="Copy"
              >
                {copiedKey === 'mezon_id' ? <Check size={17} className="text-green-600" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {/* user_id */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-gray-500 capitalize">User ID</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-gray-700">
                {showUserId ? String(user.user_id ?? '') : '••••••••'}
              </span>
              <button
                className="ml-1 text-gray-400 hover:text-gray-700"
                onClick={() => setShowUserId((v) => !v)}
                title={showUserId ? 'Ẩn' : 'Hiện'}
              >
                {showUserId ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                className="ml-1 text-gray-400 hover:text-gray-700"
                onClick={() => {
                  navigator.clipboard.writeText(String(user.user_id ?? ''));
                  setCopiedKey('user_id');
                  setTimeout(() => setCopiedKey(null), 1000);
                }}
                title="Copy"
              >
                {copiedKey === 'user_id' ? <Check size={17} className="text-green-600" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {/* aud */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-gray-500 capitalize">Aud</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-gray-700">
                {showAud ? (Array.isArray(user.aud) ? user.aud.join(', ') : String(user.aud ?? '')) : '••••••••'}
              </span>
              <button
                className="ml-1 text-gray-400 hover:text-gray-700"
                onClick={() => setShowAud((v) => !v)}
                title={showAud ? 'Ẩn' : 'Hiện'}
              >
                {showAud ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                className="ml-1 text-gray-400 hover:text-gray-700"
                onClick={() => {
                  navigator.clipboard.writeText(Array.isArray(user.aud) ? user.aud.join(', ') : String(user.aud ?? ''));
                  setCopiedKey('aud');
                  setTimeout(() => setCopiedKey(null), 1000);
                }}
                title="Copy"
              >
                {copiedKey === 'aud' ? <Check size={17} className="text-green-600" /> : <Copy size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
