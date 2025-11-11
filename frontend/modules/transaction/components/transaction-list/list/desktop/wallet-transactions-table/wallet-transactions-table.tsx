'use client';

import { format } from 'date-fns';

import { Table } from '@/components/ui/table';
import { DATE_TIME_FORMAT, PAGINATION } from '@/constant';
import { cn } from '@/lib/utils';
import {
  getTransactionStatusLabel,
  getTransactionStatusVariant,
  getTransactionTypeLabel,
  ITransaction,
} from '@/modules/transaction';
import { TTableColumn } from '@/types';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { TransactionValueSkeleton, TxnHashLink, TxnHashLinkSkeleton } from '../../shared';
import { Skeleton } from '@/components/ui/skeleton';
import { Chip } from '@/components/shared';
import { Transaction } from '@/modules/donation-campaign';

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
      renderCell: (tx) => (
        <Chip variant="warning" className="gap-1.5 rounded-md">
          <span>{getTransactionTypeLabel(tx.transaction_type)}</span>
        </Chip>
      ),
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
      renderCell: (tx) => (
        <Chip variant={getTransactionStatusVariant(tx.status)} className="gap-1.5">
          <span>{getTransactionStatusLabel(tx.status)}</span>
        </Chip>
      ),
      skeletonContent: <Skeleton className="h-5.5 w-24" />,
    },
    {
      headerContent: 'Time',
      dataKey: 'transaction_timestamp',
      renderCell: (tx) => format(DateTimeUtil.toMilliseconds(tx.transaction_timestamp), DATE_TIME_FORMAT.DATE_TIME),
    },
  ];

  return (
    <div className="bg-card min-h-[500px]">
      <Table
        getRowKey={(row) => row.hash}
        columns={columns}
        rows={transactions}
        skeletonLength={skeletonLength}
        className="[&_thead]:sticky [&_thead]:z-10"
        classNameLayout="overflow-x-visible"
        isLoading={isLoading}
      />
    </div>
  );
};
