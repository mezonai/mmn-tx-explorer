import Link from 'next/link';


import { Cube01 } from '@/assets/icons';  
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CopyButton } from '@/components/ui/copy-button';
import { ROUTES } from '@/configs/routes.config';
import { ADDRESS_END_VISIBLE_CHARS } from '@/constant';
import { IBlock } from '@/modules/block';
import { DateTimeUtil } from '@/utils';
import { HashField, TxnLink } from '@/modules/block/components/block-list/list/shared';

interface BlockCardProps {
  block?: IBlock;
}

export const BlockCard = ({ block }: BlockCardProps) => {
  return (
    <div className="bg-gray-200/60 dark:bg-gray-800/40 p-3 rounded-lg flex flex-col justify-between">
      {block ? (
        <>
          <div>
            <p className="text-[var(--color-brand-link)] font-mono text-sm mb-0.5">
              <Link href={ROUTES.BLOCK(block.block_number)} className="hover:opacity-80">
                #{block.block_number}
              </Link>
            </p>
            <div className="text-gray-600 dark:text-gray-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span>Validator:</span>
                <HashField hash={block.miner} addressClassName="text-gray-600 dark:text-gray-400" />
                <span>• {block.transaction_count} txns</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs">{DateTimeUtil.formatRelativeTimeSec(block.block_timestamp)}</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-4 w-16" />
        </>
      )}
    </div>
  );
};
