import { PAGINATION } from '@/constant';
import { useQueryParam } from './useQueryParam';

export const usePaginationQueryParam = () => {
  const { value: page, handleChangeValue: handleChangePage } = useQueryParam<number>({
    queryParam: 'page',
    defaultValue: PAGINATION.DEFAULT_PAGE,
  });
  const { value: limit, handleChangeValue: handleChangeLimit } = useQueryParam<number>({
    queryParam: 'limit',
    defaultValue: PAGINATION.DEFAULT_LIMIT,
    clearParams: ['page'],
  });

  return { page, limit, handleChangePage, handleChangeLimit };
};
