'use client';

import { DetailsTab } from './content-tabs';
import { TransactionHistoryCard } from './shared/transaction-history-card';
interface WalletDetailTabsProps {
  walletAddress: string;
}

export const WalletDetailTabs = ({ walletAddress }: WalletDetailTabsProps) => {
  return (
    <div className="flex flex-col gap-6">
      <DetailsTab walletAddress={walletAddress} />
      <TransactionHistoryCard walletAddress={walletAddress} />
    </div>
  );
};
