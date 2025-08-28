import { IWallet } from '@/modules/wallet/type';
import { WalletCard } from './wallet-card';

interface WalletCardsProps {
  wallets?: IWallet[];
  skeletonLength: number;
}

export const WalletCards = ({ wallets, skeletonLength }: WalletCardsProps) => {
  return (
    <div className="space-y-4">
      {wallets
        ? wallets.map((wallet) => <WalletCard key={wallet.address} wallet={wallet} />)
        : Array.from({ length: skeletonLength }).map((_, index) => <WalletCard key={index} />)}
    </div>
  );
};
