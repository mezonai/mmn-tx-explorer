'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

import { Clock } from '@/assets/icons';
import { AddressDisplay } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table } from '@/components/ui/table';
import { ROUTES } from '@/configs/routes.config';
import { DATE_TIME_FORMAT } from '@/constant';
import { IBlock } from '@/modules/block/types';
import { TTableColumn } from '@/types';
import { DateTimeUtil } from '@/utils';
import { TxnLink } from '../shared';

interface BlocksTableProps {
  blocks?: IBlock[];
  skeletonLength?: number;
}

export const BlocksTable = ({ blocks, skeletonLength }: BlocksTableProps) => {
  const [showAbsoluteTime, setShowAbsoluteTime] = useState(false);

  const toggleShowAbsoluteTime = () => {
    setShowAbsoluteTime((prev) => !prev);
  };

  const columns: TTableColumn<IBlock>[] = [
    {
      headerContent: (
        <div className="flex items-center gap-1">
          <span>Block</span>
          <Button variant="ghost" size="icon" className="p-0" onClick={toggleShowAbsoluteTime}>
            <Clock className="text-muted-foreground size-4" />
          </Button>
        </div>
      ),
      renderCell: (row) => {
        return (
          <div className="flex flex-col items-start">
            <Button variant="link" className="h-fit p-0" asChild>
              <Link href={ROUTES.BLOCK.replace(':id', row.block_number.toString())}>{row.block_number}</Link>
            </Button>
            <span className="text-muted-foreground text-sm">
              {showAbsoluteTime
                ? format(DateTimeUtil.toMilliseconds(row.block_timestamp), DATE_TIME_FORMAT.HUMAN_READABLE_SHORT)
                : DateTimeUtil.formatRelativeTimeSec(row.block_timestamp)}
            </span>
          </div>
        );
      },
      skeletonContent: (
        <div className="flex flex-col items-start gap-1">
          <Skeleton className="h-4.5 w-20" />
          <Skeleton className="h-4.5 w-16" />
        </div>
      ),
    },
    {
      headerContent: 'Hash',
      renderCell: (row) => (
        <AddressDisplay address={row.block_hash} className="w-60" addressClassName="text-foreground" />
      ),
    },
    {
      headerContent: 'Parent hash',
      renderCell: (row) => (
        <AddressDisplay address={row.parent_hash} className="w-60" addressClassName="text-foreground" />
      ),
    },
    {
      headerContent: 'Validator',
      renderCell: (row) => <AddressDisplay address={row.miner} className="w-50" />,
    },
    {
      headerContent: 'Txn',
      renderCell: (row) => <TxnLink count={row.transaction_count} blockNumber={row.block_number} />,
    },
  ];

  return (
    <Table
      getRowKey={(row) => row.block_number}
      columns={columns}
      rows={blocks}
      skeletonLength={skeletonLength}
      className="[&_thead]:sticky [&_thead]:top-[96px] [&_thead]:z-10"
      classNameLayout="overflow-x-visible"
    />
  );
};
