'use client';

import { Pagination } from '@/components/ui/pagination';
import { PAGINATION } from '@/constant';
import { ESortOrder } from '@/enums';
import { usePaginationQueryParam } from '@/hooks';
import { IBLockListParams } from '@/modules/block';
import { BlockCollection } from './list';
import { useBlocks } from '../../hooks/useBlocks';

const DEFAULT_VALUE_DATA_SEARCH: IBLockListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'block_number',
  sort_order: ESortOrder.DESC,
} as const;

export const BlockList = () => {
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();

  // Create search params directly from URL params to avoid double useEffect
  const searchParams: IBLockListParams = {
    ...DEFAULT_VALUE_DATA_SEARCH,
    page,
    limit,
  };

  const { data: blocksResponse, isLoading: isLoadingBlocks } = useBlocks(searchParams);

  const blocks = blocksResponse?.data;
  const pagination = blocksResponse?.meta;
  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="mb-0 text-2xl font-semibold">Blocks</h1>

      <div className="space-y-6">
        <div className="bg-background sticky top-0 z-10 mb-0 flex justify-end gap-5 py-6 md:pt-8">
          <Pagination
            page={page}
            limit={limit}
            totalPages={pagination?.total_pages ?? 0}
            totalItems={pagination?.total_items ?? 0}
            isLoading={isLoadingBlocks}
            className="w-full lg:w-auto"
            onChangePage={handleChangePage}
            onChangeLimit={handleChangeLimit}
          />
        </div>

        <BlockCollection blocks={blocks} isLoading={isLoadingBlocks} />
      </div>
    </div>
  );
};
