import { AddressDisplay } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface HashFieldProps {
  hash: string;
  className?: string;
  addressClassName?: string;
}

interface HashFieldSkeletonProps {
  className?: string;
}

export const HashField = ({ hash, className, addressClassName }: HashFieldProps) => {
  return <AddressDisplay address={hash} className={className} addressClassName={addressClassName} />;
};

export const HashFieldSkeleton = ({ className }: HashFieldSkeletonProps) => {
  return <Skeleton className={cn('h-6 w-32', className)} />;
};
