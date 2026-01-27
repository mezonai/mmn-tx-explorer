import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';
import { IBlock } from '@/modules/block';
import { DateTimeUtil } from '@/utils';

interface BlockCardProps {
  block?: IBlock;
}

export const BlockCard = ({ block }: BlockCardProps) => {
  return (
    <div className="flex min-h-[81px] flex-col justify-between rounded-lg p-3 dark:bg-gray-800/40">
      {block ? (
        <>
          <div>
            <p className="mb-0.5 font-mono text-sm text-[var(--color-brand-link)]">
              <Link href={ROUTES.BLOCK(block.block_number)} className="hover:opacity-80">
                #{block.block_number}
              </Link>
            </p>
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <span>{block.transaction_count} txns</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {DateTimeUtil.formatRelativeTimeSec(block.block_timestamp)}
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <Skeleton className="mb-1 h-5 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-4 w-16" />
        </>
      )}
    </div>
  );
};
