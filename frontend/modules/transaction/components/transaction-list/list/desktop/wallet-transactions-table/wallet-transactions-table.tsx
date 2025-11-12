'use client';

import { format } from 'date-fns';

import { Table } from '@/components/ui/table';
import { DATE_TIME_FORMAT, PAGINATION } from '@/constant';
import { cn } from '@/lib/utils';
import { ITransaction } from '@/modules/transaction';
import { TTableColumn } from '@/types';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { TransactionValueSkeleton, TxnHashLink, TxnHashLinkSkeleton, TypeBadges } from '../../shared';
import { Skeleton } from '@/components/ui/skeleton';
import { Transaction } from '@/modules/donation-campaign';
import { TxStatusBadge } from '@/modules/transaction/components/shared';

interface WalletTransactionsTableProps {
  walletAddress: string;
  transactions?: ITransaction[];
  skeletonLength?: number;
  isLoading: boolean;
}

export const WalletTransactionsTable = ({
  walletAddress,
  transactions,
  skeletonLength = PAGINATION.DEFAULT_LIMIT,
  isLoading,
}: WalletTransactionsTableProps) => {
  const columns: TTableColumn<Transaction>[] = [
    {
      headerContent: 'Hash',
      dataKey: 'hash',
      renderCell: (tx) => <TxnHashLink hash={tx.hash} isPending={false} className="w-40" />,
      skeletonContent: <TxnHashLinkSkeleton className="w-40" />,
    },
    {
      headerContent: 'Type',
      dataKey: 'transaction_type',
      renderCell: (tx) => <TypeBadges type={tx.transaction_type} />,
      skeletonContent: <Skeleton className="h-5.5 w-24" />,
    },
    {
      headerContent: 'Amount',
      dataKey: 'value',
      renderCell: (tx) => {
        const isSent = walletAddress === tx.from_address;
        return (
          <div>
            <p className={cn('max-w-3xl font-bold', isSent ? 'text-red-700' : 'text-green-700')}>
              {isSent ? '-' : '+'} {NumberUtil.formatWithCommasAndScale(tx.value)}
            </p>
          </div>
        );
      },
      skeletonContent: <TransactionValueSkeleton />,
    },
    {
      headerContent: 'Status',
      dataKey: 'status',
      renderCell: (tx) => <TxStatusBadge status={tx.status} />,
      skeletonContent: <Skeleton className="h-5.5 w-24" />,
    },
    {
      headerContent: 'Time',
      dataKey: 'transaction_timestamp',
      renderCell: (tx) => format(DateTimeUtil.toMilliseconds(tx.transaction_timestamp), DATE_TIME_FORMAT.DATE_TIME),
    },
  ];

  return (
    <div className="bg-card min-h-[300px]">
      <Table
        getRowKey={(row) => row.hash}
        columns={columns}
        rows={transactions}
        skeletonLength={skeletonLength}
        classNameLayout="overflow-x-visible"
        isLoading={isLoading}
      />
    </div>
  );
};
