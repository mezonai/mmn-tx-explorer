'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { BlockService, DASHBOARD_BLOCKS_LIMIT, IBlock, IBLockListParams } from '@/modules/block';
import { BlockCard } from './block-card';
import { BlockCardSkeleton } from './block-card-skeleton';

const DEFAULT_VALUE_DATA_SEARCH: IBLockListParams = {
  page: 0,
  limit: DASHBOARD_BLOCKS_LIMIT,
  sort_by: 'block_number',
  sort_order: 'desc',
} as const;

export const LatestBlocks = () => {
  const [blocks, setBlocks] = useState<IBlock[]>();

  const handleFetchBlocks = async () => {
    try {
      const { data } = await BlockService.getBlocks(DEFAULT_VALUE_DATA_SEARCH);
      setBlocks(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleFetchBlocks();
  }, []);

  return (
    <div className="col-span-1 space-y-4 xl:col-span-3">
      <div>
        <h2 className="text-lg font-semibold">Latest Blocks</h2>
      </div>
      <div className="space-y-3">
        {blocks
          ? blocks.map((block) => <BlockCard key={block.block_number} block={block} />)
          : Array.from({ length: DASHBOARD_BLOCKS_LIMIT }).map((_, index) => <BlockCardSkeleton key={index} />)}
      </div>
      <div className="flex w-full justify-center">
        <Button variant="link" className="font-medium" asChild>
          <Link href={ROUTES.BLOCKS}>View all blocks</Link>
        </Button>
      </div>
    </div>
  );
};
