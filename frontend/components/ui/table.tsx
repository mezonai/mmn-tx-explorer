import { ReactNode, TableHTMLAttributes } from 'react';

import { DEFAULT_PAGINATION } from '@/constant';
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
} & TableHTMLAttributes<HTMLTableElement>;

export const Table = <T,>({
  rows,
  columns,
  onRowClick = undefined,
  classNameLayout,
  className,
  showHeader = true,
  nullDataContext = 'No data',
  skeletonLength = DEFAULT_PAGINATION.LIMIT,
  ...props
}: TableProps<T>) => {
  return (
    <div className={cn('w-full overflow-x-auto', classNameLayout)}>
      <table className={cn('text-foreground w-full text-left text-sm', className)} {...props}>
        {showHeader && (
          <thead className="bg-secondary text-muted-foreground text-sm font-normal">
            <tr>
              {columns.map((column, index) => {
                const { header } = column;
                return (
                  <th key={index} className="px-4 py-3">
                    {header}
                  </th>
                );
              })}
            </tr>
          </thead>
        )}
        <tbody className="bg-card text-foreground">
          {!rows ? (
            Array.from({ length: skeletonLength }).map((_, index) => (
              <tr key={index} className="border-b">
                {columns.map((_, columnIndex) => (
                  <td key={columnIndex} className="p-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length ? (
            rows.map((row, indexRow) => (
              <tr
                key={indexRow}
                className={cn('border-b', onRowClick && 'cursor-pointer')}
                onClick={() => {
                  if (onRowClick) {
                    onRowClick(row);
                  }
                }}
              >
                {columns.map((column, indexColumn) => {
                  const { field, valueGetter } = column;
                  return (
                    <td key={indexColumn} className="p-4">
                      {valueGetter ? valueGetter(row) : field ? String(row[field] ?? '') : ''}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center">
                {nullDataContext}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
