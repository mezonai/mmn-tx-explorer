'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_PAGINATION } from '@/constant';
import { EBreakpoint } from '@/enums';
import { useBreakpoint } from '@/hooks';
import { BlockService, IBlock, IBLockListParams } from '@/modules/block';
import { GlobalSearch } from '@/modules/global-search/components';
import { IPaginationMeta } from '@/types';
import { BlockCards, BlocksTable } from './list';

const DEFAULT_VALUE_DATA_SEARCH: IBLockListParams = {
  page: DEFAULT_PAGINATION.PAGE,
  limit: DEFAULT_PAGINATION.LIMIT,
  sort_by: 'block_number',
  sort_order: 'desc',
} as const;

export const BlockList = () => {
  const urlSearchParams = useSearchParams();
  const isDesktop = useBreakpoint(EBreakpoint.LG);
  const [blocks, setBlocks] = useState<IBlock[]>();
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localSearchParams, setLocalSearchParams] = useState<IBLockListParams>();

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

  const updateSearchParam = (key: 'page', value: string | number) => {
    const currentParams = new URLSearchParams(urlSearchParams.toString());
    currentParams.set(key, String(value));
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    window.history.pushState(null, '', newUrl);
  };

  const handleChangePage = (page: number) => updateSearchParam('page', page);

  useEffect(() => {
    setLocalSearchParams({
      ...DEFAULT_VALUE_DATA_SEARCH,
      page: Number(urlSearchParams.get('page')) || DEFAULT_PAGINATION.PAGE,
    });
  }, [urlSearchParams]);

  useEffect(() => {
    if (!localSearchParams) return;
    handleFetchBlocks(localSearchParams);
  }, [localSearchParams]);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <GlobalSearch />
        <h1 className="text-2xl font-semibold">Blocks</h1>
      </div>

      <div className="space-y-6">
        <div className="flex justify-end">
          <Pagination
            page={localSearchParams?.page ?? DEFAULT_PAGINATION.PAGE}
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
