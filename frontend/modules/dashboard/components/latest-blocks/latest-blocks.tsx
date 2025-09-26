'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { cn } from '@/lib/utils';
import { BlockCard } from './block-card';
import { useLatestBlocks } from '../../hooks/useLatestBlocks';
import { DASHBOARD_BLOCKS_LIMIT } from '@/modules/block';

interface LatestBlocksProps {
  className?: string;
}

export const LatestBlocks = ({ className }: LatestBlocksProps) => {
  const blocks = useLatestBlocks();

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
