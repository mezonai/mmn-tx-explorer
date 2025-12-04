'use client';

import { P2POffer } from '../types/p2p.types';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvertiserInfoProps {
  advertiser: P2POffer['advertiser'];
}

export const AdvertiserInfo = ({ advertiser }: AdvertiserInfoProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {advertiser.avatar ? (
          <img
            src={advertiser.avatar}
            alt={advertiser.username}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
            {advertiser.username.charAt(0).toUpperCase()}
          </div>
        )}
        {advertiser.isVerified && (
          <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-card bg-green-500 dark:bg-green-500" />
        )}
      </div>
      <div>
        <div className="flex items-center gap-1 font-bold">
          <span className="text-blue-400 dark:text-blue-400">{advertiser.username}</span>
          {advertiser.isVerified && (
            <CheckCircle2 className="h-3 w-3 text-blue-500 dark:text-blue-400" />
          )}
        </div>
        <div className="text-xs text-gray-400">
          {advertiser.totalOrders.toLocaleString()} lệnh | {advertiser.completionRate}% hoàn thành
        </div>
      </div>
    </div>
  );
};

