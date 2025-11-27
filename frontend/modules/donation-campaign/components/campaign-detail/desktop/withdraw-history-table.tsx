'use client';

import { RefreshButton } from '@/components/shared';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { ROUTES } from '@/configs/routes.config';
import { DEFAULT_DEBOUNCE_TIME } from '@/hooks';
import { cn } from '@/lib/utils';
import { Transaction } from '@/modules/donation-campaign/type';
import {
  TransactionTime,
  TransactionTimeSkeleton,
  TransactionValueSkeleton,
  TxnHashLink,
  TxnHashLinkSkeleton,
} from '@/modules/transaction/components/transaction-list/list/shared';
import { TTableColumn } from '@/types';
import { NumberUtil } from '@/utils';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface WithdrawHistoryTableProps {
  transactions?: Transaction[];
  totalTransaction: number;
  walletAddress: string;
  hidden: boolean;
  isLoading?: boolean;
  refetch: () => void;
}

export function WithdrawHistoryTable({
  transactions,
  totalTransaction,
  walletAddress,
  hidden,
  isLoading = false,
  refetch,
}: WithdrawHistoryTableProps) {
  const columns: TTableColumn<Transaction>[] = [
    {
      headerContent: 'Time',
      dataKey: 'transaction_timestamp',
      renderCell: (tx) => <TransactionTime transactionTimestamp={tx.transaction_timestamp} showAbsolute={true} className='w-40'/>,
      skeletonContent: <TransactionTimeSkeleton className='w-40' />,
    },
    {
      headerContent: 'Amount',
      dataKey: 'value',
      renderCell: (tx) => (
        <span className="font-semibold text-error-primary-600 w-20 text-start">
          {NumberUtil.formatWithCommasAndScale(tx.value)}
        </span>
      ),
      skeletonContent: <TransactionValueSkeleton className="w-20" />,
    },
    {
      headerContent: 'Tx Hash',
      dataKey: 'hash',
      renderCell: (tx) => (
        <div className="flex flex-col items-start">
          <TxnHashLink hash={tx.hash} isPending={false} className="w-40" />{' '}
        </div>
      ),
      skeletonContent: <TxnHashLinkSkeleton className="w-40" />,
    },
    {
      headerContent: 'Purpose',
      dataKey: 'text_data',
      renderCell: (tx) => (
        <div className="truncate overflow-hidden max-w-80 text-start">
          <span>{tx.text_data}</span>
        </div>
      ),
      skeletonContent: <div className="h-5 w-80 rounded bg-gray-200 dark:bg-gray-700" />,
    },
  ];
  return (
    <Card className="dark:border-primary/20 overflow-x-auto p-6">
      <CardHeader className="m-0 flex items-center justify-between gap-2 px-3 py-0">
        <CardTitle className="text-foreground">Withdrawals</CardTitle>
        <RefreshButton onClick={refetch} isLoading={isLoading} startDelay={DEFAULT_DEBOUNCE_TIME} />
      </CardHeader>
      <CardContent className="p-0">
        <Table<Transaction>
          columns={columns}
          rows={transactions}
          isLoading={isLoading}
          getRowKey={(tx) => tx.hash}
          nullDataContext="No withdraw found."
          classNameLayout="border-none"
        />
      </CardContent>
      <CardFooter>
        <div className="mt-4 flex w-full items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="order-1">{`Showing ${transactions?.length ?? 0} of total ${totalTransaction}`}</span>
          <Link
            href={ROUTES.WALLET(walletAddress, 'type=sent')}
            className={cn(
              'text-brand-primary hover:text-brand-primary/70 order-2 inline-flex items-center font-medium transition',
              {
                hidden: !hidden,
              }
            )}
          >
            View full withdrawals
            <ChevronRight className="ml-1 text-sm" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
