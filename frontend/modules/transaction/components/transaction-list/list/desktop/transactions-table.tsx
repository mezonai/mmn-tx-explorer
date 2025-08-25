'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

import { Clock } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { DATE_TIME_FORMAT } from '@/constant';
import { ITransaction } from '@/modules/transaction';
import { TTableColumn } from '@/types';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { FromToAddresses, MoreInfoButton, TxnHashLink, TypeBadges } from '../shared';

interface TransactionsTableProps {
  transactions?: ITransaction[];
}

export const TransactionsTable = ({ transactions }: TransactionsTableProps) => {
  const [showAbsoluteTime, setShowAbsoluteTime] = useState(false);

  const toggleShowAbsoluteTime = () => {
    setShowAbsoluteTime((prev) => !prev);
  };

  const columns: TTableColumn<ITransaction>[] = [
    {
      valueGetter: (row) => <MoreInfoButton transaction={row} />,
    },
    {
      header: (
        <div className="flex items-center gap-1">
          <span>TXN Hash</span>
          <Button variant="ghost" size="icon" className="p-0" onClick={toggleShowAbsoluteTime}>
            <Clock className="text-muted-foreground size-4" />
          </Button>
        </div>
      ),
      valueGetter: (row) => {
        return (
          <div className="flex flex-col items-start">
            <TxnHashLink hash={row.hash} className="w-40" />
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
      header: 'Type',
      field: 'transaction_type',
      valueGetter: (row) => (
        <TypeBadges className="flex-col items-start" type={row.transaction_type} status={row.status} />
      ),
    },
    {
      header: 'Block',
      valueGetter: (row) => {
        return (
          <Button variant="link" className="p-0" asChild>
            <Link href={`/blocks/${row.block_number}`}>{row.block_number}</Link>
          </Button>
        );
      },
    },
    {
      header: 'From/To',
      valueGetter: (row) => <FromToAddresses fromAddress={row.from_address} toAddress={row.to_address} />,
    },
    {
      header: 'Value Token',
      valueGetter: (row) => NumberUtil.formatWithCommas(row.value),
    },
  ];

  return <Table columns={columns} rows={transactions} />;
};
