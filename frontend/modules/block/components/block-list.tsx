'use client';

import { useEffect, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_PAGINATION } from '@/constant';
import { EBreakpoint } from '@/enums';
import { useBreakpoint, useQueryParam } from '@/hooks';
import { BlockService, IBlock, IBLockListParams } from '@/modules/block';
import { IPaginationMeta } from '@/types';
import { BlockCards, BlocksTable } from './list';

const DEFAULT_VALUE_DATA_SEARCH: IBLockListParams = {
  page: DEFAULT_PAGINATION.PAGE,
  limit: DEFAULT_PAGINATION.LIMIT,
  sort_by: 'block_number',
  sort_order: 'desc',
} as const;

export const BlockList = () => {
  const isDesktop = useBreakpoint(EBreakpoint.LG);
  const [blocks, setBlocks] = useState<IBlock[]>();
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localSearchParams, setLocalSearchParams] = useState<IBLockListParams>();
  const { value: currentPage, handleChangeValue: handleChangePage } = useQueryParam<number>({
    queryParam: 'page',
    defaultValue: DEFAULT_PAGINATION.PAGE,
  });

  const handleFetchBlocks = async (params: IBLockListParams) => {
    try {
      setIsLoading(true);
      setBlocks(undefined);
      const { data, meta } = await BlockService.getBlocks(params);
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
      page: currentPage,
    });
  }, [currentPage]);

  useEffect(() => {
    if (!localSearchParams) return;
    handleFetchBlocks(localSearchParams);
  }, [localSearchParams]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Blocks</h1>

      <div className="space-y-6">
        <div className="flex justify-end">
          <Pagination
            page={currentPage}
            totalPages={pagination?.total_pages ?? DEFAULT_PAGINATION.PAGE}
            isLoading={isLoading}
            className="ml-auto"
            onChangePage={handleChangePage}
          />
        </div>

        <>
          {isDesktop === undefined ? (
            <>
              <div className="hidden lg:block">
                <BlocksTable blocks={blocks} />
              </div>
              <div className="lg:hidden">
                <BlockCards blocks={blocks} />
              </div>
            </>
          ) : isDesktop ? (
            <BlocksTable blocks={blocks} />
          ) : (
            <BlockCards blocks={blocks} />
          )}
        </>
      </div>
    </div>
  );
};
