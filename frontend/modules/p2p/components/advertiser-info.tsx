'use client';

import { ROUTES } from '@/configs/routes.config';
import { AddressDisplay } from '@/components/shared/address-display';

interface AdvertiserInfoProps {
  walletAddress: string;
}

export const AdvertiserInfo = ({ walletAddress }: AdvertiserInfoProps) => {
  const initials = walletAddress.slice(2, 4).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
        {initials}
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase text-gray-500">Seller wallet</span>
        <AddressDisplay address={walletAddress} href={ROUTES.WALLET(walletAddress)} />
      </div>
    </div>
  );
};

