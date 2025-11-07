'use client';
import React from 'react';
import { Truncate } from '@re-dev/react-truncate';
import { Clock4 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { TxStatusBadge } from '@/modules/transaction/components/shared/tx-status-badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Skeleton } from '@/components/ui/skeleton';
import { ITransaction } from '@/modules/transaction/types';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { ClientTimeDisplay } from './client-time-display';
import { APP_CONFIG } from '@/configs/app.config';
import { TTableColumn } from '@/types';
import { Table } from '@/components/ui/table';

interface TabDetailsProps {
  transaction?: ITransaction;
}

export const TabDetails = ({ transaction }: TabDetailsProps) => {
  const Items: TTableColumn<ITransaction>[] = [
    {
      headerContent: 'Transaction Hash',
      dataKey: 'hash',
      renderCell: (tx) => (
        <div className="flex items-center gap-2">
          <div className="flex-grow md:flex-grow-0">
            <Truncate className="text-brand-primary text-xs md:hidden">{tx.hash}</Truncate>
            <span className="text-brand-primary hidden text-xs md:block">{tx.hash}</span>
          </div>
          <CopyButton textToCopy={tx.hash} className="text-muted-foreground size-fit flex-shrink-0" />
        </div>
      ),
      skeletonContent: <Skeleton className="h-5 w-full md:w-150" />,
    },
    {
      headerContent: 'Status',
      dataKey: 'status',
      renderCell: (tx) => <TxStatusBadge status={tx.status} />,
      skeletonContent: <Skeleton className="h-5 w-20" />,
    },
    {
      headerContent: 'Block',
      dataKey: 'block_number',
      renderCell: (tx) => (
        <Button
          variant={tx.block_number ? 'link' : 'disabled'}
          className="text-brand-primary size-fit p-0 text-xs font-semibold hover:no-underline"
        >
          {tx.block_number ? <Link href={`/blocks/${tx.block_number}`}>{tx.block_number}</Link> : 'N/A'}
        </Button>
      ),
      skeletonContent: <Skeleton className="h-5 w-15" />,
    },
    {
      headerContent: 'Timestamp',
      dataKey: 'transaction_timestamp',
      renderCell: (tx) => (
        <div className="flex items-center space-x-2">
          <Clock4 className="text-foreground/70 size-4" />
          <div>
            <span>{DateTimeUtil.formatRelativeTimeSec(tx.transaction_timestamp)}</span>
            <span> | </span>
            <span>
              <ClientTimeDisplay timestamp={tx.transaction_timestamp} />
            </span>
          </div>
        </div>
      ),
      skeletonContent: <Skeleton className="h-5 w-1/2" />,
    },
    {
      headerContent: 'From',
      dataKey: 'from_address',
      renderCell: (tx) => (
        <div className="flex items-center gap-2">
          <div className="flex-grow md:flex-grow-0">
            <Truncate className="text-xs md:hidden">{tx.from_address}</Truncate>
            <span className="hidden text-xs md:block">{tx.from_address}</span>
          </div>
          <CopyButton textToCopy={tx.from_address} className="text-muted-foreground size-fit flex-shrink-0" />
        </div>
      ),
      skeletonContent: <Skeleton className="h-5 w-full md:w-150" />,
    },
    {
      headerContent: 'To',
      dataKey: 'to_address',
      renderCell: (tx) => (
        <div className="flex items-center gap-2">
          <div className="flex-grow md:flex-grow-0">
            <Truncate className="text-xs md:hidden">{tx.to_address}</Truncate>
            <span className="hidden text-xs md:block">{tx.to_address}</span>
          </div>
          <CopyButton textToCopy={tx.to_address} className="text-muted-foreground size-fit flex-shrink-0" />
        </div>
      ),
      skeletonContent: <Skeleton className="h-5 w-full md:w-150" />,
    },
    {
      headerContent: 'Value',
      dataKey: 'value',
      renderCell: (tx) => (
        <div className="flex items-center">
          <span className="text-lg font-semibold">
            {NumberUtil.formatWithCommasAndScale(tx.value)} {APP_CONFIG.CHAIN_SYMBOL}
          </span>
        </div>
      ),
      skeletonContent: <Skeleton className="h-5 w-20" />,
    },
    ...(transaction?.text_data
      ? [
          {
            headerContent: 'Note',
            dataKey: 'text_data' as keyof ITransaction,
            renderCell: (tx: ITransaction) => (
              <div className="bg-background/30 border-foreground/20 max-h-[120px] w-full overflow-y-auto border p-3 break-words whitespace-pre-wrap">
                {tx.text_data}
              </div>
            ),
            skeletonContent: <Skeleton className="h-[60px] w-full" />,
          },
        ]
      : []),
  ];

  type PairedRow = {
    columnOneLabel: React.ReactNode;
    columnOnevalue: React.ReactNode;
    columnTwoLabel?: React.ReactNode;
    columnTwoValue?: React.ReactNode;
  };

  const pairedRows: PairedRow[] = [];
  for (let i = 0; i < Items.length; i += 2) {
    const item1 = Items[i];
    const item2 = Items[i + 1];
    const getValue1 = () => {
      if (!transaction) return null;
      if (item1.renderCell) {
        return item1.renderCell(transaction, i);
      }
      return transaction[item1.dataKey as keyof ITransaction];
    };

    const getValue2 = () => {
      if (!transaction || !item2) return null;
      if (item2.renderCell) {
        return item2.renderCell(transaction, i + 1);
      }
      return transaction[item2.dataKey as keyof ITransaction];
    };

    pairedRows.push({
      columnOneLabel: item1.headerContent,
      columnOnevalue: getValue1(),
      columnTwoLabel: item2?.headerContent,
      columnTwoValue: getValue2(),
    });
  }
  const pairedColumns: TTableColumn<PairedRow>[] = [
    {
      headerContent: '',
      dataKey: 'columnOneLabel',
      renderCell: (row) => (
        <div className="flex w-full flex-col gap-2">
          <span className="text-foreground/70 text-sm font-medium">{row.columnOneLabel}</span>
          <div className="break-words">
            {row.columnOnevalue !== null && row.columnOnevalue !== undefined ? row.columnOnevalue : 'N/A'}
          </div>
        </div>
      ),
      skeletonContent: (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-full" />
        </div>
      ),
    },
    {
      headerContent: '',
      dataKey: 'columnTwoLabel',
      renderCell: (row) => (
        <div className="flex hidden w-full flex-col gap-2 md:table-cell">
          <span className="text-foreground/70 text-sm font-medium">{row.columnTwoLabel || ''}</span>
          <div className="break-words">
            {row.columnTwoValue !== null && row.columnTwoValue !== undefined
              ? row.columnTwoValue
              : row.columnTwoLabel
                ? 'N/A'
                : ''}
          </div>
        </div>
      ),
      skeletonContent: (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-full" />
        </div>
      ),
    },
  ];

  type SingleRow = {
    label: React.ReactNode;
    value: React.ReactNode;
  };

  const singleRows: SingleRow[] = [];
  for (let i = 0; i < Items.length; i++) {
    const item = Items[i];
    const getValue = () => {
      if (!transaction) return null;
      if (item.renderCell) {
        return item.renderCell(transaction, i);
      }
      return transaction[item.dataKey as keyof ITransaction];
    };

    singleRows.push({
      label: item.headerContent,
      value: getValue(),
    });
  }

  const singleColumns: TTableColumn<SingleRow>[] = [
    {
      headerContent: '',
      dataKey: 'label',
      renderCell: (row) => (
        <div className="flex w-full flex-col gap-2">
          <span className="text text-foreground/70 text-sm font-medium">{row.label}</span>
          <div className="break-words">{row.value !== null && row.value !== undefined ? row.value : 'N/A'}</div>
        </div>
      ),
      skeletonContent: (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-full" />
        </div>
      ),
    },
  ];

  return (
    <Card className="border-muted-foreground/30 space-y-4 overflow-hidden p-0">
      <CardContent className="p-3">
        {/* Mobile: Single column */}
        <div className="md:hidden">
          <Table<SingleRow>
            columns={singleColumns}
            rows={singleRows}
            isLoading={!transaction}
            showHeader={false}
            skeletonLength={Items.length}
            className="text-foreground [&_tbody_tr]:border-b-foreground/10 relative [&_tbody]:bg-transparent"
          />
        </div>
        {/* Desktop: Two columns */}
        <div className="hidden md:block">
          <Table<PairedRow>
            columns={pairedColumns}
            rows={pairedRows}
            isLoading={!transaction}
            showHeader={false}
            skeletonLength={Math.ceil(Items.length / 2)}
            className="text-foreground [&_tbody_tr]:border-b-foreground/10 relative dark:[&_tbody]:bg-transparent"
          />
        </div>
      </CardContent>
    </Card>
  );
};
