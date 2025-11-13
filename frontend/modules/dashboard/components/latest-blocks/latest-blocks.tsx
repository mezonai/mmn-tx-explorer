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
    <div className={cn('bg-card dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-xl h-full flex flex-col', className)}>
      <div className="p-6 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
        <h3 className="text-lg font-semibold">Latest Blocks</h3>
        <Button variant="link" className="text-[var(--color-brand-link)] size-fit p-0 text-sm hover:opacity-80 font-normal" asChild>
          <Link href={ROUTES.BLOCKS}>View all</Link>
        </Button>
      </div>
      <div className="p-6 space-y-[1.4rem] flex-1">
        {blocks
          ? blocks.map((block) => <BlockCard key={block.block_number} block={block} />)
          : Array.from({ length: DASHBOARD_BLOCKS_LIMIT }).map((_, index) => <BlockCard key={index} />)}
      </div>
    </div>
  );
};
