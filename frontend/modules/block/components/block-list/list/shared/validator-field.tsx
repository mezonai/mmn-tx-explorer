import { AddressDisplay } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';
import { cn } from '@/lib/utils';

interface ValidatorFieldProps {
  miner: string;
  className?: string;
  addressClassName?: string;
}

interface ValidatorFieldSkeletonProps {
  className?: string;
}

export const ValidatorField = ({ miner, className, addressClassName }: ValidatorFieldProps) => {
  return (
    <AddressDisplay
      address={miner}
      href={ROUTES.WALLET(miner)}
      className={cn(className)}
      addressClassName={cn(addressClassName)}
    />
  );
};

export const ValidatorFieldSkeleton = ({ className }: ValidatorFieldSkeletonProps) => {
  return <Skeleton className={cn('h-6 w-32', className)} />;
};
