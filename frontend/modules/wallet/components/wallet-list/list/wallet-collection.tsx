'use client';

import { EBreakpoint } from '@/enums';
import { useBreakpoint } from '@/hooks';
import { IWallet } from '@/modules/wallet/type';
import { WalletsTable } from './desktop';
import { WalletCards } from './mobile';

interface WalletCollectionProps {
  wallets?: IWallet[];
  isLoading: boolean;
}

export const WalletCollection = ({ wallets, isLoading }: WalletCollectionProps) => {
  const isDesktop = useBreakpoint(EBreakpoint.LG);

  return (
    <>
      {isDesktop === undefined ? (
        <div>
          <div className="hidden lg:block">
            <WalletsTable wallets={wallets} isLoading={isLoading} />
          </div>
          <div className="block lg:hidden">
            <WalletCards wallets={wallets} isLoading={isLoading} />
          </div>
        </div>
      ) : isDesktop ? (
        <WalletsTable wallets={wallets} isLoading={isLoading} />
      ) : (
        <WalletCards wallets={wallets} isLoading={isLoading} />
      )}
    </>
  );
};
