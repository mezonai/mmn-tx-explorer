import { Table } from '@/components/ui/table';
import { APP_CONFIG } from '@/configs/app.config';
import { IWallet } from '@/modules/wallet/type';
import { TTableColumn } from '@/types';
import {
  BalanceAmount,
  BalanceAmountSkeleton,
  RankBadge,
  RankBadgeSkeleton,
  TxnCountLink,
  TxnCountLinkSkeleton,
  WalletAddressDisplay,
  WalletAddressDisplaySkeleton,
} from '../shared';

interface WalletsTableProps {
  wallets?: IWallet[];
  skeletonLength?: number;
}

export const WalletsTable = ({ wallets, skeletonLength }: WalletsTableProps) => {
  const columns: TTableColumn<IWallet>[] = [
    {
      headerContent: 'Rank',
      renderCell: (row) => <RankBadge rank={row.rank} />,
      skeletonContent: <RankBadgeSkeleton />,
    },
    {
      headerContent: 'Address',
      renderCell: (row) => <WalletAddressDisplay address={row.address} className="w-60" />,
      skeletonContent: <WalletAddressDisplaySkeleton className="w-60" />,
    },
    {
      headerContent: `Balance ${APP_CONFIG.CHAIN_SYMBOL}`,
      renderCell: (row) => <BalanceAmount balance={row.balance} showSymbol={false} />,
      skeletonContent: <BalanceAmountSkeleton />,
    },
    {
      headerContent: 'TXN',
      renderCell: (row) => <TxnCountLink address={row.address} accountNonce={row.account_nonce} />,
      skeletonContent: <TxnCountLinkSkeleton />,
    },
  ];

  return (
    <Table
      getRowKey={(row) => row.address}
      columns={columns}
      rows={wallets}
      skeletonLength={skeletonLength}
      className="[&_thead]:sticky [&_thead]:top-[96px] [&_thead]:z-10"
      classNameLayout="overflow-x-visible"
    />
  );
};
