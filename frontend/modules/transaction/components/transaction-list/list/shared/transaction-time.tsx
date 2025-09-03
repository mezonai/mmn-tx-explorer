import { format } from 'date-fns';

import { Skeleton } from '@/components/ui/skeleton';
import { DATE_TIME_FORMAT } from '@/constant';
import { cn } from '@/lib/utils';
import { DateTimeUtil } from '@/utils';

interface TransactionTimeProps {
  blockTimestamp: number;
  showAbsolute?: boolean;
  className?: string;
}

interface TransactionTimeSkeletonProps {
  className?: string;
}

export const TransactionTime = ({ blockTimestamp, showAbsolute = false, className }: TransactionTimeProps) => {
  const timeDisplay = showAbsolute
    ? format(DateTimeUtil.toMilliseconds(blockTimestamp), DATE_TIME_FORMAT.HUMAN_READABLE_SHORT)
    : DateTimeUtil.formatRelativeTimeSec(blockTimestamp);

  return <span className={cn('text-quaternary-500 text-sm', className)}>{timeDisplay}</span>;
};

export const TransactionTimeSkeleton = ({ className }: TransactionTimeSkeletonProps) => {
  return <Skeleton className={cn('h-5 w-16', className)} />;
};
