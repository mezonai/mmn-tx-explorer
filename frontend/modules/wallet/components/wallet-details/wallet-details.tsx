'use client';

import { useState } from 'react';

import { BackButton, BreadcrumbTrail } from '@/components/shared';
import { ROUTES } from '@/configs/routes.config';
import { useQueryParam } from '@/hooks';
import { IBreadcrumb } from '@/types';
import { WalletDetailTabs } from './wallet-detail-tabs';

interface WalletDetailsProps {
  address: string;
}

const breadcrumbs: IBreadcrumb[] = [
  { label: 'Wallets', href: ROUTES.WALLETS },
  { label: 'Wallet Details', href: '#' },
] as const;

export const WalletDetails = ({ address }: WalletDetailsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { value: currentTab, handleChangeValue: handleChangeTab } = useQueryParam<string>({
    queryParam: 'tab',
    defaultValue: 'details',
    clearParams: ['page', 'limit'],
  });

  return (
    <div className="space-y-8">
      <div className="mb-0 space-y-4">
        <div>
          <BreadcrumbTrail breadcrumbs={breadcrumbs} className="hidden md:block" />
          <BackButton href={ROUTES.WALLETS} className="md:hidden" />
        </div>
        <h1 className="text-2xl font-semibold">Account Details</h1>
      </div>

      <WalletDetailTabs
        currentTab={currentTab}
        isLoading={isLoading}
        address={address}
        handleChangeTab={handleChangeTab}
      />
    </div>
  );
};
