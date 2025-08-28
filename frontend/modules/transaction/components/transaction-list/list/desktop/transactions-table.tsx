'use client';

import { useState } from 'react';

import { Clock } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { APP_CONFIG } from '@/configs/app.config';
import { ITransaction } from '@/modules/transaction';
import { TTableColumn } from '@/types';
import {
  BlockNumber,
  BlockNumberSkeleton,
  FromToAddresses,
  FromToAddressesSkeleton,
  MoreInfoButton,
  MoreInfoButtonSkeleton,
  TransactionTime,
  TransactionTimeSkeleton,
  TransactionValue,
  TransactionValueSkeleton,
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
          <Button
            variant="ghost"
            size="icon"
            className="size-fit p-0 hover:bg-transparent"
            onClick={toggleShowAbsoluteTime}
          >
            <Clock className="text-foreground-quaternary-400 size-4 font-normal" />
          </Button>
        </div>
      ),
      renderCell: (row) => (
        <div className="flex flex-col items-start">
          <TxnHashLink hash={row.hash} className="w-40" />
          <TransactionTime blockTimestamp={row.block_timestamp} showAbsolute={showAbsoluteTime} />
        </div>
      ),
      skeletonContent: (
        <div className="flex flex-col items-start gap-1">
          <TxnHashLinkSkeleton className="w-40" />
          <TransactionTimeSkeleton />
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
      renderCell: (row) => <BlockNumber blockNumber={row.block_number} />,
      skeletonContent: <BlockNumberSkeleton />,
    },
    {
      headerContent: 'From/To',
      renderCell: (row) => (
        <FromToAddresses fromAddress={row.from_address} toAddress={row.to_address} orientation="vertical" />
      ),
      skeletonContent: <FromToAddressesSkeleton orientation="vertical" />,
    },
    {
      headerContent: `Value ${APP_CONFIG.CHAIN_SYMBOL}`,
      renderCell: (row) => <TransactionValue value={row.value} />,
      skeletonContent: <TransactionValueSkeleton />,
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
