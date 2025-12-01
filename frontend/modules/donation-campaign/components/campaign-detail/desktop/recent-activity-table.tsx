'use client';

import { AddressDisplay, RefreshButton } from '@/components/shared';
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

export interface RecentActivityTableProps {
  transactions?: Transaction[];
  totalTransaction: number;
  walletAddress: string;
  hidden: boolean;
  isLoading?: boolean;
  refetch: () => void;
}

export function RecentActivityTable({
  transactions,
  totalTransaction,
  walletAddress,
  hidden,
  isLoading = false,
  refetch,
}: RecentActivityTableProps) {
  const columns: TTableColumn<Transaction>[] = [
    {
      headerContent: 'Sender',
      dataKey: 'from_address',
      renderCell: (tx) => <AddressDisplay address={tx.from_address} href={ROUTES.WALLET(tx.from_address)} />,
      skeletonContent: <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />,
    },
    {
      headerContent: 'Amount',
      dataKey: 'value',
      renderCell: (tx) => (
        <span className="font-semibold text-emerald-500 dark:text-emerald-300">
          {NumberUtil.formatWithCommasAndScale(tx.value)}
        </span>
      ),
      skeletonContent: <TransactionValueSkeleton />,
    },
    {
      headerContent: 'Time',
      dataKey: 'transaction_timestamp',
      renderCell: (tx) => <TransactionTime transactionTimestamp={tx.transaction_timestamp} showAbsolute={true} />,
      skeletonContent: <TransactionTimeSkeleton />,
    },
    {
      headerContent: 'Tx Hash',
      dataKey: 'hash',
      renderCell: (tx) => <TxnHashLink hash={tx.hash} isPending={false} />,
      skeletonContent: <TxnHashLinkSkeleton className="w-40" />,
    },
  ];
  return (
    <Card className="dark:border-primary/20 overflow-x-auto p-6">
      <CardHeader className="m-0 flex items-center justify-between gap-2 px-3 py-0">
        <CardTitle className="text-foreground">Recent Activity</CardTitle>
        <RefreshButton onClick={refetch} isLoading={isLoading} startDelay={DEFAULT_DEBOUNCE_TIME} />
      </CardHeader>
      <CardContent className="p-0">
        <Table<Transaction>
          columns={columns}
          rows={transactions}
          isLoading={isLoading}
          getRowKey={(tx) => tx.hash}
          nullDataContext="No recent activity found."
          classNameLayout="border-none"
          className="table-fixed"
        />
      </CardContent>
      <CardFooter>
        <div className="mt-4 flex w-full items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="order-1">{`Showing ${transactions?.length ?? 0} of total ${totalTransaction}`}</span>
          <Link
            href={ROUTES.WALLET(walletAddress, 'type=received')}
            className={cn(
              'text-brand-primary hover:text-brand-primary/70 order-2 inline-flex items-center font-medium transition',
              {
                hidden: !hidden,
              }
            )}
          >
            View full activity
            <ChevronRight className="ml-1 text-sm" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
