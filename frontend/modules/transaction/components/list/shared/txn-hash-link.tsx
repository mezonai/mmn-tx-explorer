import { MiddleTruncate } from '@re-dev/react-truncate';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TxnHashLinkProps {
  hash: string;
  className?: string;
}

export const TxnHashLink = ({ hash, className }: TxnHashLinkProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="link" className={cn('flex-1 p-0', className)} asChild>
          <Link href={`/transactions/${hash}`}>
            <MiddleTruncate end={4} className="font-semibold">
              {hash}
            </MiddleTruncate>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="bg-foreground max-w-xs text-center text-sm break-all">{hash}</TooltipContent>
    </Tooltip>
  );
};
