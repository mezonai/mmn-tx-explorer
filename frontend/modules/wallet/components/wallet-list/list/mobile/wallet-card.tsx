import { IWallet } from '@/modules/wallet/type';
import {
  BalanceAmount,
  BalanceAmountSkeleton,
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
    <div className="text-secondary-700 space-y-2 border-b pb-4 text-sm font-medium [&>*]:w-full [&>*]:gap-5">
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
        <span>Balance</span>
        {wallet ? (
          <BalanceAmount balance={wallet.balance} className="text-tertiary-600 font-normal" />
        ) : (
          <BalanceAmountSkeleton className="text-tertiary-600 font-normal" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <span>Txn</span>
        {wallet ? <TxnLink address={wallet.address} accountNonce={wallet.account_nonce} /> : <TxnLinkSkeleton />}
      </div>
    </div>
  );
};
