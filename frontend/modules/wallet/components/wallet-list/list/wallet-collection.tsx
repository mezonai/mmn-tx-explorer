'use client';

import { EBreakpoint } from '@/enums';
import { useBreakpoint } from '@/hooks';
import { IWallet } from '@/modules/wallet/type';
import { WalletsTable } from './desktop';
import { WalletCards } from './mobile';

interface WalletCollectionProps {
  wallets?: IWallet[];
  skeletonLength: number;
}

export const WalletCollection = ({ wallets, skeletonLength }: WalletCollectionProps) => {
  const isDesktop = useBreakpoint(EBreakpoint.LG);

  return (
    <>
      {isDesktop === undefined ? (
        <div>
          <div className="hidden lg:block">
            <WalletsTable wallets={wallets} skeletonLength={skeletonLength} />
          </div>
          <div className="block lg:hidden">
            <WalletCards wallets={wallets} skeletonLength={skeletonLength} />
          </div>
        </div>
      ) : isDesktop ? (
        <WalletsTable wallets={wallets} skeletonLength={skeletonLength} />
      ) : (
        <WalletCards wallets={wallets} skeletonLength={skeletonLength} />
      )}
    </>
  );
};
