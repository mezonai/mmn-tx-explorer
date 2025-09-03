import { format } from 'date-fns';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';
import { DATE_TIME_FORMAT } from '@/constant';
import { cn } from '@/lib/utils';
import { DateTimeUtil } from '@/utils';

interface BlockNumberFieldProps {
  blockNumber: number;
  blockTimestamp: number;
  showAbsoluteTime: boolean;
  className?: string;
}

interface BlockNumberFieldSkeletonProps {
  className?: string;
}

export const BlockNumberField = ({
  blockNumber,
  blockTimestamp,
  showAbsoluteTime,
  className,
}: BlockNumberFieldProps) => {
  return (
    <div className={cn('flex flex-col items-start', className)}>
      <Button variant="link" className="text-brand-secondary-700 size-fit p-0 font-semibold" asChild>
        <Link href={ROUTES.BLOCK(blockNumber)}>{blockNumber}</Link>
      </Button>
      <span className="text-quaternary-500 text-sm font-normal whitespace-nowrap">
        {showAbsoluteTime
          ? format(DateTimeUtil.toMilliseconds(blockTimestamp), DATE_TIME_FORMAT.HUMAN_READABLE_SHORT)
          : DateTimeUtil.formatRelativeTimeSec(blockTimestamp)}
      </span>
    </div>
  );
};

export const BlockNumberFieldSkeleton = ({ className }: BlockNumberFieldSkeletonProps) => {
  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <Skeleton className="h-4.5 w-20" />
      <Skeleton className="h-4.5 w-16" />
    </div>
  );
};
