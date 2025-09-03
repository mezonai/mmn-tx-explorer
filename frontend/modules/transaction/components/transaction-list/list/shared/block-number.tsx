import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';
import { cn } from '@/lib/utils';

interface BlockNumberProps {
  blockNumber: number;
  className?: string;
}

interface BlockNumberSkeletonProps {
  className?: string;
}

export const BlockNumber = ({ blockNumber, className }: BlockNumberProps) => {
  return (
    <Button variant="link" className={cn('size-fit p-0', className)} asChild>
      <Link href={ROUTES.BLOCK(blockNumber)}>{blockNumber}</Link>
    </Button>
  );
};

export const BlockNumberSkeleton = ({ className }: BlockNumberSkeletonProps) => {
  return <Skeleton className={cn('h-5 w-16', className)} />;
};
