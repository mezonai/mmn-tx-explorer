import Link from 'next/link';

import { MiddleTruncate } from '@re-dev/react-truncate';

import { Cube01 } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';
import { ADDRESS_END_VISIBLE_CHARS } from '@/constant';
import { IBlock } from '@/modules/block';
import { DateTimeUtil } from '@/utils';

interface BlockCardProps {
  block?: IBlock;
}

export const BlockCard = ({ block }: BlockCardProps) => {
  return (
    <Card className="p-0">
      <CardContent className="space-y-2 p-5">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cube01 className="text-foreground-brand-secondary-500 size-6" />
            {block ? (
              <Button variant="link" asChild className="text-brand-secondary-700 size-fit p-0 text-xl font-medium">
                <Link href={ROUTES.BLOCK(block.block_number)}>{block.block_number}</Link>
              </Button>
            ) : (
              <Skeleton className="h-7 w-16" />
            )}
          </div>
          {block ? (
            <p className="text-quaternary-500 text-sm font-normal">
              {DateTimeUtil.formatRelativeTimeSec(block.block_timestamp)}
            </p>
          ) : (
            <Skeleton className="h-5 w-20" />
          )}
        </div>
        <div className="space-y-1 text-sm font-medium">
          <div className="flex items-center justify-between gap-2">
            <span className="text-secondary-700 font-medium">Txn</span>
            {block ? (
              <span className="text-tertiary-600 text-right font-normal">{block.transaction_count}</span>
            ) : (
              <Skeleton className="h-5 w-8" />
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-secondary-700 font-medium">Validator</span>
            {block ? (
              <Button
                variant="link"
                className="text-brand-secondary-700 size-fit w-24 p-0 text-right font-normal"
                asChild
              >
                <Link href={ROUTES.WALLET(block.miner)}>
                  <MiddleTruncate end={ADDRESS_END_VISIBLE_CHARS}>{block.miner}</MiddleTruncate>
                </Link>
              </Button>
            ) : (
              <Skeleton className="h-5 w-24" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
