'use client';

import { useState } from 'react';

import { Clock } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { ETransactionOrientation, ETransactionStatus, ITransaction } from '@/modules/transaction';
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
} from '../../shared';
import { PAGINATION } from '@/constant';
import { usePaginationQueryParam } from '@/hooks';
import { TEXT_CONSTANT } from '@/constant';

interface TransactionsTableProps {
  transactions?: ITransaction[];
  skeletonLength?: number;
  isLoading: boolean;
}

export const TransactionsTable = ({
  transactions,
  skeletonLength = PAGINATION.DEFAULT_LIMIT,
  isLoading,
}: TransactionsTableProps) => {
  const [showAbsoluteTime, setShowAbsoluteTime] = useState(false);
  const toggleShowAbsoluteTime = () => {
    setShowAbsoluteTime((prev) => !prev);
  };
  const { page, limit } = usePaginationQueryParam();
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
          <TxnHashLink hash={row.hash} isPending={row.status === ETransactionStatus.Pending} className="w-40" />
          <TransactionTime transactionTimestamp={row.transaction_timestamp} showAbsolute={showAbsoluteTime} />
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
      renderCell: (row) => <BlockNumber blockNumber={row.block_number || TEXT_CONSTANT.NA} />,
      skeletonContent: <BlockNumberSkeleton />,
    },
    {
      headerContent: 'From/To',
      renderCell: (row) => (
        <FromToAddresses
          fromAddress={row.from_address}
          toAddress={row.to_address}
          orientation={ETransactionOrientation.Vertical}
        />
      ),
      skeletonContent: <FromToAddressesSkeleton orientation={ETransactionOrientation.Vertical} />,
    },
    {
      headerContent: 'Value',
      renderCell: (row) => <TransactionValue value={row.value} showSymbol />,
      skeletonContent: <TransactionValueSkeleton />,
    },
  ];

  return (
    <Table
      key={`${page}-${limit}`}
      getRowKey={(row) => row.hash}
      columns={columns}
      rows={transactions}
      skeletonLength={skeletonLength}
      className="[&_thead]:sticky [&_thead]:top-[96px] [&_thead]:z-10"
      classNameLayout="overflow-x-visible"
      isLoading={isLoading}
    />
  );
};
