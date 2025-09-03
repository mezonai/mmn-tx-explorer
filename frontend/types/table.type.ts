import { ReactNode } from 'react';

export type TTableColumn<T> = {
  headerContent?: ReactNode;
  dataKey?: keyof T;
  renderCell?: (row: T, index: number) => ReactNode;
  skeletonContent?: ReactNode;
};
