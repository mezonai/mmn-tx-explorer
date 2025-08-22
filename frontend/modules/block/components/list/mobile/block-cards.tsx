import { IBlock } from '@/modules/block/types';
import { BlockCard } from './block-card';
import { BlockCardSkeleton } from './block-card-skeleton';

interface BlockCardsProps {
  blocks?: IBlock[];
}

export const BlockCards = ({ blocks }: BlockCardsProps) => {
  return (
    <div className="space-y-4">
      {blocks
        ? blocks.map((block) => <BlockCard key={block.block_number} block={block} />)
        : Array.from({ length: 20 }).map((_, index) => <BlockCardSkeleton key={index} />)}
    </div>
  );
};
