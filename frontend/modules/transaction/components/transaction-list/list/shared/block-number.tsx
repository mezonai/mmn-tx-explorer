import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';
import { cn } from '@/lib/utils';

interface BlockNumberProps {
  blockNumber: number | string;
  className?: string;
}

interface BlockNumberSkeletonProps {
  className?: string;
}

export const BlockNumber = ({ blockNumber, className }: BlockNumberProps) => {
  const isPending = blockNumber === 'N/A';
  const buttonVariant = isPending ? 'disabled' : 'link';
  return (
    <Button
      variant={buttonVariant}
      className={cn('text-brand-secondary-700 size-fit p-0 text-sm font-semibold', className)}
      asChild
    >
      {isPending ? <span>{blockNumber}</span> : <Link href={ROUTES.BLOCK(blockNumber as number)}>{blockNumber}</Link>}
    </Button>
  );
};

export const BlockNumberSkeleton = ({ className }: BlockNumberSkeletonProps) => {
  return <Skeleton className={cn('h-5 w-16', className)} />;
};
