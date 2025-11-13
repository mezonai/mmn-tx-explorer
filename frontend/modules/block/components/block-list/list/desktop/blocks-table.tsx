'use client';

import { useState } from 'react';

import { Clock } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { IBlock } from '@/modules/block/types';
import { TTableColumn } from '@/types';
import {
  BlockNumberField,
  BlockNumberFieldSkeleton,
  HashField,
  HashFieldSkeleton,
  TxnLink,
  TxnLinkSkeleton,
} from '../shared';
import { PAGINATION } from '@/constant';
import { usePaginationQueryParam } from '@/hooks';

interface BlocksTableProps {
  blocks?: IBlock[];
  skeletonLength?: number;
  isLoading: boolean;
}

export const BlocksTable = ({ blocks, skeletonLength = PAGINATION.DEFAULT_LIMIT, isLoading }: BlocksTableProps) => {
  const [showAbsoluteTime, setShowAbsoluteTime] = useState(false);
  const { page, limit } = usePaginationQueryParam();
  const toggleShowAbsoluteTime = () => {
    setShowAbsoluteTime((prev) => !prev);
  };

  const columns: TTableColumn<IBlock>[] = [
    {
      headerContent: (
        <div className="flex items-center gap-1">
          <span>Block</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-fit p-0 hover:bg-transparent"
            onClick={toggleShowAbsoluteTime}
          >
            <Clock className="text-foreground-quaternary-400 size-4" />
          </Button>
        </div>
      ),
      renderCell: (row) => (
        <BlockNumberField
          blockNumber={row.block_number}
          blockTimestamp={row.block_timestamp}
          showAbsoluteTime={showAbsoluteTime}
        />
      ),
      skeletonContent: <BlockNumberFieldSkeleton />,
    },
    {
      headerContent: 'Hash',
      renderCell: (row) => (
        <HashField hash={row.block_hash} className="w-60 lg:w-40 xl:w-60" addressClassName="text-foreground" />
      ),
      skeletonContent: <HashFieldSkeleton />,
    },
    // {
    //   headerContent: 'Parent hash',
    //   renderCell: (row) => (
    //     <HashField hash={row.parent_hash} className="w-60 lg:w-40 xl:w-60" addressClassName="text-foreground" />
    //   ),
    //   skeletonContent: <HashFieldSkeleton />,
    // },
    // {
    //   headerContent: 'Validator',
    //   renderCell: (row) => (
    //     <HashField hash={row.miner} className="w-60 lg:w-40 xl:w-60" addressClassName="text-foreground" />
    //   ),
    //   skeletonContent: <HashFieldSkeleton />,
    // },
    {
      headerContent: 'Txn',
      renderCell: (row) => <TxnLink count={row.transaction_count} blockNumber={row.block_number} />,
      skeletonContent: <TxnLinkSkeleton />,
    },
  ];

  return (
    <div className="bg-card border-muted-foreground/30 border-separate rounded-lg border p-3">
      <Table
        key={`${page}-${limit}`}
        getRowKey={(row) => row.block_number}
        columns={columns}
        rows={blocks}
        skeletonLength={skeletonLength}
        className="[&_thead]:text-muted-foreground border-muted-foreground/30 [&_thead>tr>th]:border-muted-foreground/30 rounded-lg [&_tbody]:bg-transparent [&_tbody>tr:last-child>td:first-child]:rounded-bl-lg [&_tbody>tr:last-child>td:last-child]:rounded-br-lg [&_thead]:bg-transparent [&_thead]:uppercase [&_thead>tr>th]:border-b [&_thead>tr>th:first-child]:rounded-tl-lg [&_thead>tr>th:last-child]:rounded-tr-lg"
        classNameLayout="overflow-x-visible overflow-y-hidden"
        isLoading={isLoading}
        estimateRowHeight={72.5}
      />
    </div>
  );
};
