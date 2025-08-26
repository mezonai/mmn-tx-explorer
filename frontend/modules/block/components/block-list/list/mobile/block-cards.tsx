import { DEFAULT_PAGINATION } from '@/constant';
import { IBlock } from '@/modules/block/types';
import { BlockCard } from './block-card';
import { BlockCardSkeleton } from './block-card-skeleton';

interface BlockCardsProps {
  blocks?: IBlock[];
  skeletonLength?: number;
}

export const BlockCards = ({ blocks, skeletonLength = DEFAULT_PAGINATION.LIMIT }: BlockCardsProps) => {
  return (
    <div className="space-y-4">
      {blocks
        ? blocks.map((block) => <BlockCard key={block.block_number} block={block} />)
        : Array.from({ length: skeletonLength }).map((_, index) => <BlockCardSkeleton key={index} />)}
    </div>
  );
};
