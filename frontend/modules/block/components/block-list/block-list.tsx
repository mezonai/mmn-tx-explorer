'use client';

import { useEffect, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { PAGINATION } from '@/constant';
import { EBreakpoint, ESortOrder } from '@/enums';
import { useBreakpoint, useQueryParam } from '@/hooks';
import { BlockService, IBlock, IBLockListParams } from '@/modules/block';
import { IPaginationMeta } from '@/types';
import { BlockCards, BlocksTable } from './list';

const DEFAULT_VALUE_DATA_SEARCH: IBLockListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'block_number',
  sort_order: ESortOrder.DESC,
} as const;

export const BlockList = () => {
  const isDesktop = useBreakpoint(EBreakpoint.LG);
  const [blocks, setBlocks] = useState<IBlock[]>();
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localSearchParams, setLocalSearchParams] = useState<IBLockListParams>();
  const { value: page, handleChangeValue: handleChangePage } = useQueryParam<number>({
    queryParam: 'page',
    defaultValue: PAGINATION.DEFAULT_PAGE,
  });
  const { value: limit, handleChangeValue: handleChangeLimit } = useQueryParam<number>({
    queryParam: 'limit',
    defaultValue: PAGINATION.DEFAULT_LIMIT,
    clearParams: ['page'],
  });

  const handleFetchBlocks = async (params: IBLockListParams) => {
    try {
      setIsLoading(true);
      setBlocks(undefined);
      const { data, meta } = await BlockService.getBlocks({
        ...params,
        page: params.page - 1,
      });
      setBlocks(data);
      setPagination(meta);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setLocalSearchParams({
      ...DEFAULT_VALUE_DATA_SEARCH,
      page,
      limit,
    });
  }, [page, limit]);

  useEffect(() => {
    if (!localSearchParams) return;
    handleFetchBlocks(localSearchParams);
  }, [localSearchParams]);

  return (
    <div className="space-y-8">
      <h1 className="mb-0 text-2xl font-semibold">Blocks</h1>

      <div className="space-y-6">
        <div className="bg-background sticky top-0 z-10 mb-0 flex justify-end gap-5 pt-8 pb-6">
          <Pagination
            page={page}
            limit={limit}
            totalPages={pagination?.total_pages ?? 0}
            totalItems={pagination?.total_items ?? 0}
            isLoading={isLoading}
            className="w-full lg:w-auto"
            onChangePage={handleChangePage}
            onChangeLimit={handleChangeLimit}
          />
        </div>

        <>
          {isDesktop === undefined ? (
            <div>
              <div className="hidden lg:block">
                <BlocksTable blocks={blocks} skeletonLength={limit} />
              </div>
              <div className="lg:hidden">
                <BlockCards blocks={blocks} skeletonLength={limit} />
              </div>
            </div>
          ) : isDesktop ? (
            <BlocksTable blocks={blocks} skeletonLength={limit} />
          ) : (
            <BlockCards blocks={blocks} skeletonLength={limit} />
          )}
        </>
      </div>
    </div>
  );
};
