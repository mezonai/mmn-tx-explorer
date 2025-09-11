'use client';

import { format } from 'date-fns';

import { Table } from '@/components/ui/table';
import { DATE_TIME_FORMAT, PAGINATION } from '@/constant';
import { cn } from '@/lib/utils';
import { ETransactionStatus, ITransaction } from '@/modules/transaction';
import { TTableColumn } from '@/types';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { MoreInfoButton, MoreInfoButtonSkeleton, TxnHashLink, TxnHashLinkSkeleton } from '../../shared';

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
  const columns: TTableColumn<ITransaction>[] = [
    {
      renderCell: (row) => <MoreInfoButton transaction={row} />,
      skeletonContent: <MoreInfoButtonSkeleton />,
    },
    {
      headerContent: 'Txn Hash',
      renderCell: (row) => (
        <TxnHashLink hash={row.hash} isPending={row.status === ETransactionStatus.Pending} className="w-40" />
      ),
      skeletonContent: <TxnHashLinkSkeleton className="w-40" />,
    },
    {
      headerContent: 'Created At',
      renderCell: (row) => format(DateTimeUtil.toMilliseconds(row.transaction_timestamp), DATE_TIME_FORMAT.DATE_TIME),
    },
    {
      headerContent: <p className="text-end">Amount</p>,
      renderCell: (row) => {
        const isSent = walletAddress === row.from_address;
        return (
          <div className="flex flex-col justify-end gap-1 text-end text-sm">
            <p className={cn('font-bold', isSent ? 'text-error-primary-600' : 'text-utility-success-600')}>
              {isSent ? '-' : '+'} {NumberUtil.formatWithCommasAndScale(row.value)}
            </p>
            <p className={cn('text-quaternary-500 font-normal')}>{isSent ? 'Sent' : 'Received'}</p>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-[500px]">
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
