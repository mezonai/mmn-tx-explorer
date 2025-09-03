import { PAGINATION } from '@/constant';
import { IBlock } from '@/modules/block/types';
import { BlockCard } from './block-card';

interface BlockCardsProps {
  blocks?: IBlock[];
  skeletonLength?: number;
}

export const BlockCards = ({ blocks, skeletonLength = PAGINATION.DEFAULT_LIMIT }: BlockCardsProps) => {
  return (
    <div className="space-y-4">
      {blocks
        ? blocks.map((block) => <BlockCard key={block.block_number} block={block} />)
        : Array.from({ length: skeletonLength }).map((_, index) => <BlockCard key={index} />)}
    </div>
  );
};
