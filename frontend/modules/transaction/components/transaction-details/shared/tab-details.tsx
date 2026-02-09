'use client';
import React from 'react';
import { Truncate } from '@re-dev/react-truncate';
import { Clock4 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { TxStatusBadge } from '@/modules/transaction/components/shared/tx-status-badge';
import {
  TypeBadges,
  TypeBadgesSkeleton,
} from '@/modules/transaction/components/transaction-list/list/shared/type-badges';
import {
  FromToAddresses,
  FromToAddressesSkeleton,
} from '@/modules/transaction/components/transaction-list/list/shared/from-to-addresses';
import { ETransactionOrientation } from '@/modules/transaction/enums';
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
      headerContent: 'Status',
      dataKey: 'status',
      renderCell: (tx) => <TxStatusBadge status={tx.status} />,
      skeletonContent: <Skeleton className="h-5 w-20" />,
    },
    {
      headerContent: 'Transaction Type',
      dataKey: 'transaction_extra_info_type' as keyof ITransaction,
      renderCell: (tx) => <TypeBadges type={tx.transaction_extra_info_type} />,
      skeletonContent: <TypeBadgesSkeleton />,
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
      headerContent: 'From / To',
      dataKey: 'from_to' as keyof ITransaction,
      renderCell: (tx) => (
        <FromToAddresses
          fromAddress={tx.from_address}
          toAddress={tx.to_address}
          orientation={ETransactionOrientation.Horizontal}
        />
      ),
      skeletonContent: <FromToAddressesSkeleton orientation={ETransactionOrientation.Horizontal} />,
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
              <div className="w-full">
                <div className="bg-muted-foreground/6 text-foreground/90 min-h-[60px] w-full rounded-md p-3 text-sm dark:bg-gray-800">
                  {tx.text_data}
                </div>
              </div>
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
      <div className={cn('flex w-full flex-col gap-2', hideOnDesktop && 'hidden md:flex')}>
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
    fullRow?: boolean;
    __fullWidthContent?: React.ReactNode;
  };

  const pairedRows: PairedRow[] = [];
  for (let i = 0; i < Items.length; ) {
    const item = Items[i];

    if ((item as any).fullWidth || item.headerContent === 'Note') {
      const content = getCellValue(item, i);
      pairedRows.push({
        columnOneLabel: item.headerContent,
        columnOneValue: content,
        columnTwoLabel: null,
        columnTwoValue: null,
        fullRow: true,
        __fullWidthContent: renderLabelValueCell(item.headerContent, content),
      });
      i += 1;
      continue;
    }

    const next = Items[i + 1];
    pairedRows.push({
      columnOneLabel: item.headerContent,
      columnOneValue: getCellValue(item, i),
      columnTwoLabel: next?.headerContent,
      columnTwoValue: next ? getCellValue(next, i + 1) : null,
    });
    i += 2;
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
    <Card className="border-muted-foreground/30 space-y-4 overflow-hidden rounded-xl p-4">
      <CardContent className="p-4">
        {/* Mobile & Tablet: Single column */}
        <div className="lg:hidden">
          <Table<SingleRow>
            columns={singleColumns}
            rows={singleRows}
            isLoading={!transaction}
            showHeader={false}
            skeletonLength={Items.length}
            className="text-foreground [&_tbody_tr]:border-b-foreground/10 relative text-left dark:[&_tbody]:bg-transparent"
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
            className="text-foreground [&_tbody_tr]:border-b-foreground/10 relative text-left dark:[&_tbody]:bg-transparent"
          />
        </div>
      </CardContent>
    </Card>
  );
};
