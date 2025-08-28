import { AddressDisplay } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';

interface AddressDisplayProps {
  address: string;
  className?: string;
}

interface WalletAddressDisplaySkeletonProps {
  className?: string;
}

export const WalletAddressDisplay = ({ address, className }: AddressDisplayProps) => {
  return (
    <AddressDisplay
      address={address}
      href={ROUTES.WALLET(address)}
      className={className}
      addressClassName="font-semibold"
    />
  );
};

export const WalletAddressDisplaySkeleton = ({ className }: WalletAddressDisplaySkeletonProps) => {
  return <Skeleton className={`h-6 w-32 ${className}`} />;
};
