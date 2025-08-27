import { MiddleTruncate } from '@re-dev/react-truncate';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ADDRESS_END_VISIBLE_CHARS } from '@/constant';
import { cn } from '@/lib/utils';

interface TxnHashLinkProps {
  hash: string;
  className?: string;
}

interface TxnHashLinkSkeletonProps {
  className?: string;
}

export const TxnHashLink = ({ hash, className }: TxnHashLinkProps) => {
  return (
    <div className={cn('flex flex-1 items-center gap-1', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="link" className="size-fit flex-1 p-0" asChild>
            <Link href={`/transactions/${hash}`}>
              <MiddleTruncate end={ADDRESS_END_VISIBLE_CHARS} className="font-semibold">
                {hash}
              </MiddleTruncate>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-foreground max-w-xs text-center text-sm break-all">{hash}</TooltipContent>
      </Tooltip>
      <CopyButton textToCopy={hash} />
    </div>
  );
};

export const TxnHashLinkSkeleton = ({ className }: TxnHashLinkSkeletonProps) => {
  return (
    <div className={cn('flex flex-1 items-center gap-1', className)}>
      <Skeleton className="h-5 flex-1" />
      <Skeleton className="size-4" />
    </div>
  );
};
