import { ReactNode } from 'react';

export type TTableColumn<T> = {
  headerName?: string;
  field?: keyof T;
  valueGetter?: (row: T) => ReactNode;
};
