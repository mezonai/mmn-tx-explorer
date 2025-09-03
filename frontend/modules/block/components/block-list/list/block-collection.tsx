'use client';

import { EBreakpoint } from '@/enums';
import { useBreakpoint } from '@/hooks';
import { IBlock } from '@/modules/block/types';
import { BlocksTable } from './desktop';
import { BlockCards } from './mobile';

interface BlockCollectionProps {
  blocks?: IBlock[];
  skeletonLength: number;
}

export const BlockCollection = ({ blocks, skeletonLength }: BlockCollectionProps) => {
  const isDesktop = useBreakpoint(EBreakpoint.LG);

  return (
    <>
      {isDesktop === undefined ? (
        <div>
          <div className="hidden lg:block">
            <BlocksTable blocks={blocks} skeletonLength={skeletonLength} />
          </div>
          <div className="lg:hidden">
            <BlockCards blocks={blocks} skeletonLength={skeletonLength} />
          </div>
        </div>
      ) : isDesktop ? (
        <BlocksTable blocks={blocks} skeletonLength={skeletonLength} />
      ) : (
        <BlockCards blocks={blocks} skeletonLength={skeletonLength} />
      )}
    </>
  );
};
