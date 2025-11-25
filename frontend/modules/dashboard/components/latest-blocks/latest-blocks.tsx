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
    <div
      className={cn(
        'bg-card flex h-full flex-col rounded-xl border border-gray-300 shadow-sm dark:border-gray-700 dark:shadow-sm',
        className
      )}
    >
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-300 p-6 dark:border-gray-700">
        <h3 className="text-lg font-semibold">Latest Blocks</h3>
        <Button
          variant="link"
          className="size-fit p-0 text-sm font-normal text-[var(--color-brand-link)] hover:opacity-80"
          asChild
        >
          <Link href={ROUTES.BLOCKS}>View all</Link>
        </Button>
      </div>
      <div className="flex-1 space-y-[1.4rem] p-6">
        {blocks
          ? blocks.map((block) => <BlockCard key={block.block_number} block={block} />)
          : Array.from({ length: DASHBOARD_BLOCKS_LIMIT }).map((_, index) => <BlockCard key={index} />)}
      </div>
    </div>
  );
};
