import { MiddleTruncate } from '@re-dev/react-truncate';
import { format } from 'date-fns';
import Link from 'next/link';

import { Cube01 } from '@/assets/icons';
import { DATE_TIME_FORMAT } from '@/constant';
import { IBlock } from '@/modules/block';

interface BlockSearchResultItemProps {
  block: IBlock;
}

export const BlockSearchResultItem = ({ block }: BlockSearchResultItemProps) => {
  return (
    <Link
      href={`/blocks/${block.block_number}`}
      className="focus:bg-muted hover:bg-muted active:bg-muted flex flex-col items-start justify-between gap-1 rounded px-1 py-3 lg:flex-row lg:items-center lg:gap-2"
    >
      <div className="flex items-center justify-start gap-2">
        <Cube01 className="size-5" />
        <span className="text-foreground text-sm font-bold">{block.block_number}</span>
      </div>
      <div className="flex w-full flex-1 flex-col items-start gap-1 lg:w-auto lg:flex-row lg:items-center lg:gap-2">
        <span className="w-full flex-1 text-left text-sm font-medium lg:w-auto lg:text-right">
          <MiddleTruncate end={4}>{block.block_hash}</MiddleTruncate>
        </span>
        <span className="line-clamp-1 text-sm font-medium">
          {format(block.block_timestamp * 1000, DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET)}
        </span>
      </div>
    </Link>
  );
};
