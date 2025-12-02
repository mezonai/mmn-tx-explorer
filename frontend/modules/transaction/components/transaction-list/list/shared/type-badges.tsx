import { Chip } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ETransferType, getTransactionTypeLabel } from '@/modules/transaction';

interface TypeBadgesProps {
  type: ETransferType;
  className?: string;
}

interface TypeBadgesSkeletonProps {
  className?: string;
}

const getTransactionTypeClass = (type: ETransferType) => {
  switch (type) {
    case ETransferType.GiveCoffee:
      return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-300';
    case ETransferType.DonationCampaign:
      return 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-300';
    case ETransferType.WithdrawCampaign:
      return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300';
    case ETransferType.LuckyMoney:
      return 'bg-pink-100 text-pink-600 dark:bg-pink-500/10 dark:text-pink-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
  }
};

export const TypeBadges = ({ className, type }: TypeBadgesProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Chip variant="default" className={cn('gap-1.5 rounded-md', getTransactionTypeClass(type))}>
        <span>{getTransactionTypeLabel(type)}</span>
      </Chip>
    </div>
  );
};

export const TypeBadgesSkeleton = ({ className }: TypeBadgesSkeletonProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Skeleton className="h-5.5 w-24" />
      <Skeleton className="h-5.5 w-24" />
    </div>
  );
};
