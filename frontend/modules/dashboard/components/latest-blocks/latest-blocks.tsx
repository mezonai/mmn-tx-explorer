'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { ESortOrder } from '@/enums';
import { cn } from '@/lib/utils';
import { BlockService, DASHBOARD_BLOCKS_LIMIT, IBlock, IBLockListParams } from '@/modules/block';
import { BlockCard } from './block-card';

interface LatestBlocksProps {
  className?: string;
}

const DEFAULT_VALUE_DATA_SEARCH: IBLockListParams = {
  page: 0,
  limit: DASHBOARD_BLOCKS_LIMIT,
  sort_by: 'block_number',
  sort_order: ESortOrder.DESC,
} as const;

export const LatestBlocks = ({ className }: LatestBlocksProps) => {
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
    <div className={cn('space-y-4', className)}>
      <div>
        <h2 className="text-lg font-semibold">Latest Blocks</h2>
      </div>
      <div className="space-y-3">
        {blocks
          ? blocks.map((block) => <BlockCard key={block.block_number} block={block} />)
          : Array.from({ length: DASHBOARD_BLOCKS_LIMIT }).map((_, index) => <BlockCard key={index} />)}
      </div>
      <div className="flex w-full justify-center">
        <Button variant="link" className="text-brand-secondary-700 size-fit p-0 font-semibold" asChild>
          <Link href={ROUTES.BLOCKS}>View all blocks</Link>
        </Button>
      </div>
    </div>
  );
};
