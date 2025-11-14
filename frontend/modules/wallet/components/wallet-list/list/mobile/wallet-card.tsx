import { IWallet } from '@/modules/wallet/type';
import {
  RankBadge,
  RankBadgeSkeleton,
  TxnLink,
  TxnLinkSkeleton,
  WalletAddressDisplay,
  WalletAddressDisplaySkeleton,
} from '../shared';

interface WalletCardProps {
  wallet?: IWallet;
}

export const WalletCard = ({ wallet }: WalletCardProps) => {
  return (
    <div className="text-foreground space-y-2 border-b py-2 text-sm font-medium [&>*]:w-full [&>*]:gap-5">
      <div className="flex items-center justify-between">
        <span>Rank</span>
        {wallet ? <RankBadge rank={wallet.rank} /> : <RankBadgeSkeleton />}
      </div>
      <div className="flex items-center justify-between">
        <span>Address</span>
        {wallet ? (
          <WalletAddressDisplay address={wallet.address} className="w-50" />
        ) : (
          <WalletAddressDisplaySkeleton className="w-50" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <span>Txn Count</span>
        {wallet ? <TxnLink address={wallet.address} accountNonce={wallet.transaction_count} /> : <TxnLinkSkeleton />}
      </div>
    </div>
  );
};
