'use client';

import { PAGINATION } from '@/constant';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { IBlock } from '@/modules/block/types';
import { BlockCard } from './block-card';
import { usePaginationQueryParam } from '@/hooks';

interface BlockCardsProps {
  blocks?: IBlock[];
  skeletonLength?: number;
  isLoading: boolean;
}

export const BlockCards = ({ blocks, skeletonLength = PAGINATION.DEFAULT_LIMIT, isLoading }: BlockCardsProps) => {
  const { page, limit } = usePaginationQueryParam();
  return (
    <VirtualizedList
      key={`${page}-${limit}`}
      items={blocks}
      isLoading={isLoading}
      isEmpty={!blocks || blocks.length === 0}
      skeletonCount={skeletonLength}
      estimateSize={150}
      overscan={8}
      maxHeight={600}
      minItemsForVirtualization={50}
      getItemKey={(b) => b.block_number}
      className="space-y-4"
      itemClassName=""
      renderItem={(block) => <BlockCard block={block} />}
      renderSkeletonItem={(i) => <BlockCard key={i} />}
      renderEmpty={() => <div className="space-y-4" />}
    />
  );
};
