'use client';

import { ReactNode, TableHTMLAttributes, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

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
  estimateRowHeight?: number;
  overscan?: number;
  maxHeight?: number;
  minRowsForVirtualization?: number;
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
  estimateRowHeight = 56,
  overscan = 8,
  maxHeight = 600,
  minRowsForVirtualization = 50,
  ...props
}: TableProps<T>) => {
  // Validate columns to prevent runtime errors
  const validColumns = columns.filter(Boolean);

  // Determine loading state - either explicitly set or when rows is undefined
  const shouldShowSkeleton = isLoading || !rows;

  // Enable virtualization only when we have many rows and we're not showing skeletons
  const isVirtualized = !shouldShowSkeleton && (rows?.length ?? 0) >= minRowsForVirtualization;

  // Scroll container ref for virtualization
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Configure virtualizer (always initialize; use only when virtualized)
  const rowVirtualizer = useVirtualizer({
    count: rows?.length ?? 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => estimateRowHeight, // approximate row height in px
    overscan: overscan,
    // Stable keys for measurement cache
    getItemKey: (index) => {
      if (rows && getRowKey) {
        try {
          return String(getRowKey(rows[index] as T, index));
        } catch {
          return index;
        }
      }
      return index;
    },
  });

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

  // Generate data rows (non-virtualized)
  const renderDataRows = () => {
    if (shouldShowSkeleton || !rows?.length) return null;
    if (isVirtualized) return null;

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
          {validColumns.map(({ dataKey, renderCell }, columnIndex) => {
            const recordRow = row as unknown as Record<string, unknown>;
            const cellValue = dataKey ? recordRow[String(dataKey)] : '';
            return (
              <td key={columnIndex} className="p-4">
                {renderCell ? renderCell(row, index) : dataKey ? String(cellValue ?? '') : ''}
              </td>
            );
          })}
        </tr>
      );
    });
  };

  // Generate data rows (virtualized)
  const renderVirtualRows = () => {
    if (!isVirtualized || !rows?.length) return null;

    const virtualItems = rowVirtualizer.getVirtualItems();
    const paddingTop = virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
    const lastItem = virtualItems[virtualItems.length - 1];
    const totalSize = rowVirtualizer.getTotalSize();
    const paddingBottom = lastItem ? Math.max(totalSize - (lastItem.start + lastItem.size), 0) : 0;

    return (
      <>
        {paddingTop > 0 && (
          <tr style={{ height: paddingTop }} aria-hidden="true">
            {validColumns.map((_, i) => (
              <td key={i} className="p-0" />
            ))}
          </tr>
        )}
        {virtualItems.map((vi) => {
          const index = vi.index;
          const row = rows?.[index];
          if (row === undefined) return null;
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
              ref={rowVirtualizer.measureElement}
              data-index={index}
            >
              {validColumns.map(({ dataKey, renderCell }, columnIndex) => {
                const recordRow = row as unknown as Record<string, unknown>;
                const cellValue = dataKey ? recordRow[String(dataKey)] : '';
                return (
                  <td key={columnIndex} className="p-4">
                    {renderCell ? renderCell(row, index) : dataKey ? String(cellValue ?? '') : ''}
                  </td>
                );
              })}
            </tr>
          );
        })}
        {paddingBottom > 0 && (
          <tr style={{ height: paddingBottom }} aria-hidden="true">
            {validColumns.map((_, i) => (
              <td key={i} className="p-0" />
            ))}
          </tr>
        )}
      </>
    );
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
    <div
      ref={scrollContainerRef}
      className={cn('w-full', classNameLayout, isVirtualized && 'overflow-y-auto')}
      style={isVirtualized ? { maxHeight: maxHeight } : undefined}
    >
      <table
        className={cn(
          'text-tertiary-600 w-full text-left text-sm font-normal [&_thead]:top-[96px]',
          className,
          isVirtualized && '[&_thead]:top-[0px]'
        )}
        role="table"
        {...props}
      >
        {showHeader && (
          <thead className={'bg-active text-quaternary-500 text-xs font-normal'}>
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
          {renderSkeletonRows() || renderVirtualRows() || renderDataRows() || renderEmptyRow()}
        </tbody>
      </table>
    </div>
  );
};
