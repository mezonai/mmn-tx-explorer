import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';
import { cn } from '@/lib/utils';
import { TEXT_CONSTANT } from '@/constant';

interface BlockNumberProps {
  blockNumber: number | string;
  className?: string;
}

interface BlockNumberSkeletonProps {
  className?: string;
}

export const BlockNumber = ({ blockNumber, className }: BlockNumberProps) => {
  const isPending = blockNumber === TEXT_CONSTANT.NA;
  const buttonVariant = isPending ? 'disabled' : 'link';
  return (
    <Button
      variant={buttonVariant}
      className={cn('text-brand-secondary-700 size-fit p-0 text-sm font-semibold', className)}
      asChild
    >
      {isPending ? <span>{blockNumber}</span> : <Link href={ROUTES.BLOCK(Number(blockNumber))}>{blockNumber}</Link>}
    </Button>
  );
};

export const BlockNumberSkeleton = ({ className }: BlockNumberSkeletonProps) => {
  return <Skeleton className={cn('h-5 w-16', className)} />;
};
