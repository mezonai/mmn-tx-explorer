'use client';

import { EBreakpoint } from '@/enums';
import { useBreakpoint } from '@/hooks';
import { IBlock } from '@/modules/block/types';
import { BlocksTable } from './desktop';
import { BlockCards } from './mobile';
import { PAGINATION } from '@/constant';

interface BlockCollectionProps {
  blocks?: IBlock[];
  skeletonLength?: number;
  isLoading: boolean;
}

export const BlockCollection = ({
  blocks,
  skeletonLength = PAGINATION.DEFAULT_LIMIT,
  isLoading,
}: BlockCollectionProps) => {
  const isDesktop = useBreakpoint(EBreakpoint.LG);

  return (
    <>
      {isDesktop === undefined ? (
        <div>
          <div className="hidden lg:block">
            <BlocksTable blocks={blocks} skeletonLength={skeletonLength} isLoading={isLoading} />
          </div>
          <div className="lg:hidden">
            <BlockCards blocks={blocks} skeletonLength={skeletonLength} isLoading={isLoading} />
          </div>
        </div>
      ) : isDesktop ? (
        <BlocksTable blocks={blocks} skeletonLength={skeletonLength} isLoading={isLoading} />
      ) : (
        <BlockCards blocks={blocks} skeletonLength={skeletonLength} isLoading={isLoading} />
      )}
    </>
  );
};
