import { MiddleTruncate } from '@re-dev/react-truncate';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/configs/routes.config';
import { ADDRESS_END_VISIBLE_CHARS } from '@/constant';
import { cn } from '@/lib/utils';

interface TxnHashLinkProps {
  hash: string;
  isPending: boolean;
  className?: string;
  hasTooltip?: boolean;
}

interface TxnHashLinkSkeletonProps {
  className?: string;
}

export const TxnHashLink = ({ hash, isPending, className, hasTooltip = true }: TxnHashLinkProps) => {
  return (
    <div className={cn('flex flex-1 items-center gap-1', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="link" className="dark:text-brand-primary size-fit flex-1 p-0" asChild>
            <Link href={isPending ? ROUTES.PENDING_TRANSACTION(hash) : ROUTES.TRANSACTION(hash)}>
              <MiddleTruncate end={ADDRESS_END_VISIBLE_CHARS} className="font-semibold">
                {hash}
              </MiddleTruncate>
            </Link>
          </Button>
        </TooltipTrigger>
        {hasTooltip && (
          <TooltipContent className="bg-foreground max-w-xs text-center text-sm break-all">{hash}</TooltipContent>
        )}
      </Tooltip>
      <CopyButton textToCopy={hash} />
    </div>
  );
};

export const TxnHashLinkSkeleton = ({ className }: TxnHashLinkSkeletonProps) => {
  return (
    <div className={cn('flex flex-1 items-center gap-1', className)}>
      <Skeleton className="h-5 flex-1" />
      <Skeleton className="size-5" />
    </div>
  );
};

export const TxnHashLinkDashboard = ({ hash, isPending, className }: TxnHashLinkProps) => {
  const truncated = hash ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : '';
  return (
    <div className={cn('flex flex-1 items-center gap-1', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="link" className="dark:text-brand-primary size-fit flex-1 p-0" asChild>
            <Link href={isPending ? ROUTES.PENDING_TRANSACTION(hash) : ROUTES.TRANSACTION(hash)}>
              <span className="text-brand-primary font-semibold">{truncated}</span>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-foreground max-w-xs text-center text-sm break-all">{hash}</TooltipContent>
      </Tooltip>
      <CopyButton textToCopy={hash} className="ml-2" />
    </div>
  );
};
