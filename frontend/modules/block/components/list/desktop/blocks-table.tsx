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
import { GasUsage, TxnLink } from '../shared';

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
      header: 'Size, bytes',
      field: 'size',
    },
    {
      header: 'Validator',
      valueGetter: (row) => <AddressDisplay address={row.miner} />,
    },
    {
      header: 'Txn',
      valueGetter: (row) => <TxnLink count={row.transaction_count} blockNumber={row.block_number} />,
    },
    {
      header: 'Gas used',
      valueGetter: (row) => <GasUsage gasUsed={row.gas_used} gasLimit={row.gas_limit} />,
    },
    {
      header: 'Burnt fees',
      valueGetter: () => {
        return '0';
      },
    },
    {
      header: 'Base fee',
      field: 'base_fee_per_gas',
    },
  ];

  return <Table columns={columns} rows={blocks} />;
};
