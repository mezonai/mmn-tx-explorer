import { ReactNode } from 'react';

export type TTableColumn<T> = {
  header?: ReactNode;
  field?: keyof T;
  valueGetter?: (row: T) => ReactNode;
};
