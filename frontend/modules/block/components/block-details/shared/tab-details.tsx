'use client';
import React from 'react';
import { Truncate } from '@re-dev/react-truncate';
import { Clock4 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Skeleton } from '@/components/ui/skeleton';
import { IBlockDetails } from '../../../types';
import { DateTimeUtil } from '@/utils';
import { DATE_TIME_FORMAT } from '@/constant';
import { format } from 'date-fns';
import { TTableColumn } from '@/types';
import { Table } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ButtonNavigateBlock } from './button-navigate';
import { useStats } from '@/modules/dashboard/hooks/useStas';

interface TabDetailsProps {
  blockDetails: IBlockDetails;
}

export const TabDetails = ({ blockDetails }: TabDetailsProps) => {
  const block = blockDetails.block;
  const stats = useStats();
  const hasNextBlock = stats && block.block_number < stats.total_blocks - 1;

  const Items: TTableColumn<IBlockDetails>[] = [
    {
      headerContent: 'Block Height',
      renderCell: (details) => (
        <div className="flex items-center gap-2">
          <div className="text-brand-primary">
            <span>{details.block.block_number}</span>{' '}
          </div>
          <div className="ml-2 flex items-center gap-2">
            {details.block.parent_hash && (
              <ButtonNavigateBlock direction="previous" blockNumber={block.block_number - 1} />
            )}
            {hasNextBlock && <ButtonNavigateBlock direction="next" blockNumber={block.block_number + 1} />}
          </div>
        </div>
      ),
      skeletonContent: <Skeleton className="h-5 w-20" />,
    },
    {
      headerContent: 'Transactions Count',
      renderCell: (details) => <span>{details.block.transaction_count}</span>,
      skeletonContent: <Skeleton className="h-5 w-15" />,
    },
    {
      headerContent: 'Block Timestamp',
      renderCell: (details) => (
        <div className="flex items-center space-x-2">
          <Clock4 className="text-foreground/70 size-4" />
          <div>
            <span>{DateTimeUtil.formatRelativeTimeSec(details.block.block_timestamp)}</span>
            <span> | </span>
            <span>
              {format(
                DateTimeUtil.toMilliseconds(details.block.block_timestamp),
                DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET
              )}
            </span>
          </div>
        </div>
      ),
      skeletonContent: <Skeleton className="h-5 w-1/2" />,
    },
    {
      headerContent: '',
      renderCell: () => null,
      skeletonContent: null,
    },
    {
      headerContent: 'Block Hash',
      renderCell: (details) => (
        <div className="flex items-center gap-2">
          <div className="flex-grow md:flex-grow-0">
            <Truncate className="text-xs md:hidden">{details.block.block_hash}</Truncate>
            <span className="hidden text-xs md:block">{details.block.block_hash}</span>
          </div>
          <CopyButton textToCopy={details.block.block_hash} className="text-muted-foreground size-fit flex-shrink-0" />
        </div>
      ),
      skeletonContent: <Skeleton className="h-5 w-full md:w-150" />,
    },
    {
      headerContent: 'Parent Hash',
      renderCell: (details) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/blocks/${details.block.block_number - 1}`}
            className="text-brand-primary flex-grow md:flex-grow-0"
          >
            <Truncate className="text-xs md:hidden">{details.block.parent_hash}</Truncate>
            <span className="hidden text-xs md:block">{details.block.parent_hash}</span>
          </Link>
          <CopyButton textToCopy={details.block.parent_hash} className="text-muted-foreground size-fit flex-shrink-0" />
        </div>
      ),
      skeletonContent: <Skeleton className="h-5 w-full md:w-150" />,
    },
  ];

  const getCellValue = (item: TTableColumn<IBlockDetails>, index: number) => {
    if (!blockDetails) return null;
    if (item.renderCell) return item.renderCell(blockDetails, index);
    return null;
  };

  const renderLabelValueCell = (label: React.ReactNode, value: React.ReactNode, hideOnDesktop = false) => {
    const hasValue = value !== null && value !== undefined;
    const displayValue = hasValue ? value : label ? 'N/A' : '';

    return (
      <div className={cn('flex w-full flex-col gap-2', hideOnDesktop && 'hidden md:table-cell')}>
        {label && <span className="text-foreground/70 text-sm font-medium">{label}</span>}
        <div className="break-words">{displayValue}</div>
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
        {/* Mobile: Single column */}
        <div className="md:hidden">
          <Table<SingleRow>
            columns={singleColumns}
            rows={singleRows}
            isLoading={!blockDetails}
            showHeader={false}
            skeletonLength={Items.length}
            className="text-foreground [&_tbody_tr]:border-b-foreground/10 relative text-left dark:[&_tbody]:bg-transparent"
          />
        </div>
        {/* Desktop: Two columns */}
        <div className="hidden md:block">
          <Table<PairedRow>
            columns={pairedColumns}
            rows={pairedRows}
            isLoading={!blockDetails}
            showHeader={false}
            skeletonLength={Math.ceil(Items.length / 2)}
            className="text-foreground [&_tbody_tr]:border-b-foreground/10 relative text-left dark:[&_tbody]:bg-transparent"
          />
        </div>
      </CardContent>
    </Card>
  );
};
