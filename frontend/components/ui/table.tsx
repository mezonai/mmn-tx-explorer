import { ReactNode, TableHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { TTableColumn } from '@/types';
import { Skeleton } from './skeleton';

export type TableProps<T> = {
  columns: TTableColumn<T>[];
  rows: T[];
  onRowClick?: (data: T) => void;
  showHeader?: boolean;
  nullDataContext?: string | ReactNode;
  classNameLayout?: string;
  isLoading?: boolean;
} & TableHTMLAttributes<HTMLTableElement>;

export const Table = <T,>(props: TableProps<T>) => {
  const {
    rows,
    columns,
    onRowClick = undefined,
    classNameLayout,
    className,
    showHeader = true,
    nullDataContext = 'No data',
    isLoading = true,
    ...otherProps
  } = props;

  return (
    <div className={cn('space-y-5', classNameLayout)}>
      <div className="w-full overflow-x-auto rounded-none border shadow md:rounded-lg">
        <table
          className={cn(
            'text-foreground w-full text-left text-sm rtl:text-right',
            className
          )}
          {...otherProps}
        >
          {showHeader && (
            <thead className="bg-secondary text-foreground text-xs uppercase">
              <tr>
                {columns.map((column, index) => {
                  const { headerName } = column;
                  return (
                    <th key={index} className="px-6 py-4">
                      {headerName}
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}
          <tbody className="bg-card text-foreground">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <tr key={index} className="border-b">
                  {columns.map((_, columnIndex) => (
                    <td key={columnIndex} className="px-6 py-4">
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
                      <td key={indexColumn} className="px-6 py-4">
                        {valueGetter
                          ? valueGetter(row)
                          : field
                            ? String(row[field] ?? '')
                            : ''}
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
    </div>
  );
};
