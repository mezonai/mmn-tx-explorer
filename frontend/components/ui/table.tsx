import { ReactNode, TableHTMLAttributes } from 'react';

import { PAGINATION } from '@/constant';
import { cn } from '@/lib/utils';
import { TTableColumn } from '@/types';
import { Skeleton } from './skeleton';

type TableProps<T> = {
  columns: TTableColumn<T>[];
  rows?: T[];
  onRowClick?: (data: T) => void;
  showHeader?: boolean;
  nullDataContext?: string | ReactNode;
  classNameLayout?: string;
  skeletonLength?: number;
  getRowKey?: (row: T, index: number) => string | number;
  isLoading?: boolean;
} & TableHTMLAttributes<HTMLTableElement>;

export const Table = <T,>({
  rows,
  columns,
  onRowClick,
  classNameLayout,
  className,
  showHeader = true,
  nullDataContext = 'No data',
  skeletonLength = PAGINATION.DEFAULT_LIMIT,
  getRowKey,
  isLoading = false,
  ...props
}: TableProps<T>) => {
  // Validate columns to prevent runtime errors
  const validColumns = columns.filter(Boolean);

  // Determine loading state - either explicitly set or when rows is undefined
  const shouldShowSkeleton = isLoading || !rows;

  // Validate that we have columns
  if (!validColumns.length) {
    console.warn('Table: No valid columns provided');
    return null;
  }

  // Generate skeleton rows
  const renderSkeletonRows = () => {
    if (!shouldShowSkeleton) return null;

    return Array.from({ length: skeletonLength }, (_, index) => (
      <tr key={`skeleton-${index}`} className="border-b">
        {validColumns.map(({ skeletonContent }, columnIndex) => (
          <td key={columnIndex} className="p-4">
            {skeletonContent ?? <Skeleton className="h-5 w-full" />}
          </td>
        ))}
      </tr>
    ));
  };

  // Generate data rows
  const renderDataRows = () => {
    if (shouldShowSkeleton || !rows?.length) return null;

    return rows.map((row, index) => {
      const rowKey = getRowKey ? getRowKey(row, index) : index;
      const hasClickHandler = !!onRowClick;

      const handleRowClick = () => {
        if (onRowClick) {
          onRowClick(row);
        }
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (hasClickHandler && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleRowClick();
        }
      };

      return (
        <tr
          key={rowKey}
          className={cn('border-b', hasClickHandler && 'hover:bg-muted/50 cursor-pointer transition-colors')}
          onClick={hasClickHandler ? handleRowClick : undefined}
          role={hasClickHandler ? 'button' : undefined}
          tabIndex={hasClickHandler ? 0 : undefined}
          onKeyDown={hasClickHandler ? handleKeyDown : undefined}
        >
          {validColumns.map(({ dataKey, renderCell }, columnIndex) => (
            <td key={columnIndex} className="p-4">
              {renderCell ? renderCell(row, index) : dataKey ? String(row[dataKey] ?? '') : ''}
            </td>
          ))}
        </tr>
      );
    });
  };

  // Render empty state
  const renderEmptyRow = () => {
    if (shouldShowSkeleton || (rows && rows.length > 0)) return null;

    return (
      <tr>
        <td colSpan={validColumns.length} className="text-muted-foreground p-4 text-center">
          {nullDataContext}
        </td>
      </tr>
    );
  };

  return (
    <div className={cn('w-full overflow-x-auto', classNameLayout)}>
      <table
        className={cn('text-tertiary-600 w-full text-left text-sm font-normal', className)}
        role="table"
        {...props}
      >
        {showHeader && (
          <thead className="bg-active text-quaternary-500 text-xs font-normal">
            <tr role="row">
              {validColumns.map(({ headerContent }, index) => (
                <th
                  key={index}
                  className={cn('px-4 py-3', shouldShowSkeleton && 'pointer-events-none opacity-50')}
                  role="columnheader"
                >
                  {headerContent}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="bg-card" role="rowgroup">
          {renderSkeletonRows() || renderDataRows() || renderEmptyRow()}
        </tbody>
      </table>
    </div>
  );
};
