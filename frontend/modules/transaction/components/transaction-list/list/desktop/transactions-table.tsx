'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

import { Clock } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table } from '@/components/ui/table';
import { APP_CONFIG } from '@/configs/app.config';
import { DATE_TIME_FORMAT } from '@/constant';
import { ITransaction } from '@/modules/transaction';
import { TTableColumn } from '@/types';
import { DateTimeUtil, NumberUtil } from '@/utils';
import {
  FromToAddresses,
  FromToAddressesSkeleton,
  MoreInfoButton,
  MoreInfoButtonSkeleton,
  TxnHashLink,
  TxnHashLinkSkeleton,
  TypeBadges,
  TypeBadgesSkeleton,
} from '../shared';

interface TransactionsTableProps {
  transactions?: ITransaction[];
  skeletonLength?: number;
}

export const TransactionsTable = ({ transactions, skeletonLength }: TransactionsTableProps) => {
  const [showAbsoluteTime, setShowAbsoluteTime] = useState(false);

  const toggleShowAbsoluteTime = () => {
    setShowAbsoluteTime((prev) => !prev);
  };

  const columns: TTableColumn<ITransaction>[] = [
    {
      renderCell: (row) => <MoreInfoButton transaction={row} />,
      skeletonContent: <MoreInfoButtonSkeleton />,
    },
    {
      headerContent: (
        <div className="flex items-center gap-1">
          <span>TXN Hash</span>
          <Button variant="ghost" size="icon" className="p-0" onClick={toggleShowAbsoluteTime}>
            <Clock className="text-muted-foreground size-4" />
          </Button>
        </div>
      ),
      renderCell: (row) => (
        <div className="flex flex-col items-start">
          <TxnHashLink hash={row.hash} className="w-40" />
          <span className="text-muted-foreground text-sm">
            {showAbsoluteTime
              ? format(DateTimeUtil.toMilliseconds(row.block_timestamp), DATE_TIME_FORMAT.HUMAN_READABLE_SHORT)
              : DateTimeUtil.formatRelativeTimeSec(row.block_timestamp)}
          </span>
        </div>
      ),
      skeletonContent: (
        <div className="flex flex-col items-start gap-1">
          <TxnHashLinkSkeleton className="w-40" />
          <Skeleton className="h-5 w-16" />
        </div>
      ),
    },
    {
      headerContent: 'Type',
      dataKey: 'transaction_type',
      renderCell: (row) => (
        <TypeBadges className="flex-col items-start" type={row.transaction_type} status={row.status} />
      ),
      skeletonContent: <TypeBadgesSkeleton className="flex-col items-start" />,
    },
    {
      headerContent: 'Block',
      renderCell: (row) => {
        return (
          <Button variant="link" className="h-fit p-0" asChild>
            <Link href={`/blocks/${row.block_number}`}>{row.block_number}</Link>
          </Button>
        );
      },
    },
    {
      headerContent: 'From/To',
      renderCell: (row) => <FromToAddresses fromAddress={row.from_address} toAddress={row.to_address} />,
      skeletonContent: <FromToAddressesSkeleton />,
    },
    {
      headerContent: `Value ${APP_CONFIG.CHAIN_SYMBOL}`,
      renderCell: (row) => NumberUtil.formatWithCommas(row.value),
    },
  ];

  return (
    <Table
      getRowKey={(row) => row.hash}
      columns={columns}
      rows={transactions}
      skeletonLength={skeletonLength}
      className="[&_thead]:sticky [&_thead]:top-[96px] [&_thead]:z-10"
      classNameLayout="overflow-x-visible"
    />
  );
};
