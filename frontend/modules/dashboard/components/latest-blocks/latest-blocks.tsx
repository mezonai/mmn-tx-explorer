import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import { IBlock } from '@/modules/block';
import { BlockCard } from './block-card';
import { BlockCardSkeleton } from './block-card-skeleton';

interface LatestBlocksProps {
  blocks?: IBlock[];
}

export const LatestBlocks = ({ blocks }: LatestBlocksProps) => {
  return (
    <div className="col-span-1 space-y-4 xl:col-span-3">
      <div>
        <h2 className="text-lg font-semibold">Latest Blocks</h2>
        <p className="text-muted-foreground text-sm">
          Network utilization: <strong className="text-primary font-semibold">48.60%</strong>
        </p>
      </div>
      <div className="space-y-3">
        {blocks
          ? blocks.map((block) => <BlockCard key={block.block_number} block={block} />)
          : Array.from({ length: 3 }).map((_, index) => <BlockCardSkeleton key={index} />)}
      </div>
      <div className="flex w-full justify-center">
        <Button variant="link" className="font-medium" asChild>
          <Link href={ROUTES.BLOCKS}>View all blocks</Link>
        </Button>
      </div>
    </div>
  );
};
