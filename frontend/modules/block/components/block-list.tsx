'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_PAGINATION } from '@/constant';
import { cn } from '@/lib/utils';
import { BlockService, IBlock, IBLockListParams } from '@/modules/block';
import { GlobalSearch } from '@/modules/global-search';
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
  const [activeTab, setActiveTab] = useState<'all' | 'forked' | 'uncles'>('all');
  const [blocks, setBlocks] = useState<IBlock[]>();
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localSearchParams, setLocalSearchParams] = useState<IBLockListParams>();

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

  const handleChangePage = (page: number) => {
    const currentParams = new URLSearchParams(urlSearchParams.toString());
    currentParams.set('page', page.toString());
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    window.history.pushState(null, '', newUrl);
  };

  useEffect(() => {
    setLocalSearchParams({
      ...DEFAULT_VALUE_DATA_SEARCH,
      page: Number(urlSearchParams.get('page')) || 1,
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
        <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
          <div className="bg-muted flex items-center gap-1 self-start rounded-md p-1">
            <Button
              variant={activeTab === 'all' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className={cn('border border-transparent px-3 py-2', activeTab === 'all' && 'hover:bg-background')}
              disabled={isLoading}
            >
              All
            </Button>
            <Button
              variant={activeTab === 'forked' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('forked')}
              className={cn('border border-transparent px-3 py-2', activeTab === 'forked' && 'hover:bg-background')}
              disabled={isLoading}
            >
              Forked
            </Button>
            <Button
              variant={activeTab === 'uncles' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('uncles')}
              className={cn('border border-transparent px-3 py-2', activeTab === 'uncles' && 'hover:bg-background')}
              disabled={isLoading}
            >
              Uncles
            </Button>
          </div>

          <Pagination
            page={localSearchParams?.page ?? 1}
            totalPages={pagination?.total_pages ?? 1}
            isLoading={isLoading}
            className="self-end"
            onChangePage={handleChangePage}
          />
        </div>

        <>
          <div className="hidden lg:block">
            <BlocksTable blocks={blocks} />
          </div>

          <div className="lg:hidden">
            <BlockCards blocks={blocks} />
          </div>
        </>
      </div>
    </div>
  );
};
