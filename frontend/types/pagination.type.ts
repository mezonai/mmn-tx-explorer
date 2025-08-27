export interface IPaginatedResponse<T> {
  data: T;
  meta: IPaginationMeta;
}

export interface IPaginationMeta {
  address: string;
  chain_id: number;
  limit: number;
  page: number;
  signature: string;
  total_items: number;
  total_pages: number;
}

export type TOnChangePage = (selected: number) => void;
