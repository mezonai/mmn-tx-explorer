'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

import { Clock } from '@/assets/icons';
import { AddressDisplay } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { ROUTES } from '@/configs/routes.config';
import { DATE_TIME_FORMAT } from '@/constant';
import { IBlock } from '@/modules/block/types';
import { TTableColumn } from '@/types';
import { DateTimeUtil } from '@/utils';
import { TxnLink } from '../shared';

interface BlocksTableProps {
  blocks?: IBlock[];
}

export const BlocksTable = ({ blocks }: BlocksTableProps) => {
  const [showAbsoluteTime, setShowAbsoluteTime] = useState(false);

  const toggleShowAbsoluteTime = () => {
    setShowAbsoluteTime((prev) => !prev);
  };

  const columns: TTableColumn<IBlock>[] = [
    {
      header: (
        <div className="flex items-center gap-1">
          <span>Block</span>
          <Button variant="ghost" size="icon" className="p-0" onClick={toggleShowAbsoluteTime}>
            <Clock className="text-muted-foreground size-4" />
          </Button>
        </div>
      ),
      valueGetter: (row) => {
        return (
          <div className="flex flex-col items-start">
            <Button variant="link" className="h-fit p-0" asChild>
              <Link href={ROUTES.BLOCK.replace(':id', row.block_number.toString())}>{row.block_number}</Link>
            </Button>
            <span className="text-muted-foreground text-sm">
              {showAbsoluteTime
                ? format(row.block_timestamp * 1000, DATE_TIME_FORMAT.HUMAN_READABLE_SHORT)
                : DateTimeUtil.formatRelativeTime(row.block_timestamp * 1000)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Hash',
      valueGetter: (row) => (
        <AddressDisplay address={row.block_hash} className="w-60" addressClassName="text-foreground" />
      ),
    },
    {
      header: 'Parent hash',
      valueGetter: (row) => (
        <AddressDisplay address={row.parent_hash} className="w-60" addressClassName="text-foreground" />
      ),
    },
    {
      header: 'Validator',
      valueGetter: (row) => <AddressDisplay address={row.miner} className="w-50" />,
    },
    {
      header: 'Txn',
      valueGetter: (row) => <TxnLink count={row.transaction_count} blockNumber={row.block_number} />,
    },
  ];

  return <Table columns={columns} rows={blocks} />;
};
