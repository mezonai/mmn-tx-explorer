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
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

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
              <Textarea className="bg-primary/5 w-full px-3 sm:resize-y" readOnly rows={2} cols={40} value={tx.text_data} />
            ),
            skeletonContent: <Skeleton className="h-[60px] w-full" />,
          },
        ]
      : []),
  ];

  const getCellValue = (item: TTableColumn<ITransaction>, index: number) => {
    if (!transaction) return null;
    if (item.renderCell) return item.renderCell(transaction, index);
    return transaction[item.dataKey as keyof ITransaction];
  };

  const renderLabelValueCell = (label: React.ReactNode, value: React.ReactNode, hideOnDesktop = false) => {
    const hasValue = value !== null && value !== undefined;
    const displayValue = hasValue ? value : label ? 'N/A' : '';

    return (
      <div className={cn('flex w-full flex-col gap-2', hideOnDesktop && 'hidden md:table-cell')}>
        {label && <span className="text-foreground/70 text-sm font-medium">{label}</span>}
        <div className="w-full break-words">{displayValue}</div>
      </div>
    );
  };

  const labelValueSkeleton = (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-5 w-full" />
    </div>
  );

  type SingleRow = { label: React.ReactNode; value: React.ReactNode };
  const singleRows: SingleRow[] = Items.map((item, i) => ({
    label: item.headerContent,
    value: getCellValue(item, i),
  }));

  const singleColumns: TTableColumn<SingleRow>[] = [
    {
      headerContent: '',
      dataKey: 'label',
      renderCell: (row) => renderLabelValueCell(row.label, row.value),
      skeletonContent: labelValueSkeleton,
    },
  ];

  type PairedRow = {
    columnOneLabel: React.ReactNode;
    columnOneValue: React.ReactNode;
    columnTwoLabel?: React.ReactNode;
    columnTwoValue?: React.ReactNode;
  };

  const pairedRows: PairedRow[] = [];
  for (let i = 0; i < Items.length; i += 2) {
    pairedRows.push({
      columnOneLabel: Items[i].headerContent,
      columnOneValue: getCellValue(Items[i], i),
      columnTwoLabel: Items[i + 1]?.headerContent,
      columnTwoValue: Items[i + 1] ? getCellValue(Items[i + 1], i + 1) : null,
    });
  }

  const pairedColumns: TTableColumn<PairedRow>[] = [
    {
      headerContent: '',
      dataKey: 'columnOneLabel',
      renderCell: (row) => renderLabelValueCell(row.columnOneLabel, row.columnOneValue),
      skeletonContent: labelValueSkeleton,
    },
    {
      headerContent: '',
      dataKey: 'columnTwoLabel',
      renderCell: (row) => renderLabelValueCell(row.columnTwoLabel, row.columnTwoValue, true),
      skeletonContent: labelValueSkeleton,
    },
  ];

  return (
    <Card className="border-muted-foreground/30 space-y-4 overflow-hidden p-0">
      <CardContent className="p-3">
        {/* Mobile & Tablet: Single column */}
        <div className="lg:hidden">
          <Table<SingleRow>
            columns={singleColumns}
            rows={singleRows}
            isLoading={!transaction}
            showHeader={false}
            skeletonLength={Items.length}
            className="text-foreground [&_tbody_tr]:border-b-foreground/10 relative dark:[&_tbody]:bg-transparent"
          />
        </div>
        {/* Desktop: Two columns */}
        <div className="hidden lg:block">
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
