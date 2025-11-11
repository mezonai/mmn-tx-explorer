'use client';

import { useWallet } from '@/modules/wallet/hooks/useWallet';
import { DetailsTab } from './content-tabs';
import { TransactionHistoryCard } from './shared/transaction-history-card';
interface WalletDetailTabsProps {
  walletAddress: string;
}

export const WalletDetailTabs = ({ walletAddress }: WalletDetailTabsProps) => {
  const { data: walletDetailsResponse, refetch, isLoading } = useWallet(walletAddress);
  const walletDetails = walletDetailsResponse?.data;
  return (
    <>
      {walletDetails && (
        <div className="flex flex-col gap-6">
          <DetailsTab walletDetails={walletDetails} refetch={refetch} isLoading={isLoading} />
          <TransactionHistoryCard walletAddress={walletDetails.address} />
        </div>
      )}
    </>
  );
};
