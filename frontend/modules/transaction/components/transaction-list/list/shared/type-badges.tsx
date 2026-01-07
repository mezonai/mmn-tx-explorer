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

const getTransactionTypeInfo = (type: ETransferType) => {
  switch (type) {
    case ETransferType.DonationCampaign:
      return 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-300';
    case ETransferType.WithdrawCampaign:
      return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300';
    case ETransferType.LuckyMoney:
      return 'bg-pink-100 text-pink-600 dark:bg-pink-500/10 dark:text-pink-300';
    case ETransferType.DonationFeedCampaign:
      return 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300';
    case ETransferType.GiveCoffee:
    case ETransferType.DongGiveCoffee:
      return 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300';
    case ETransferType.P2PTrading:
      return 'bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300';
    case ETransferType.TokenTransfer:
    default:
      return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-300';
  }
};

export const TypeBadges = ({ className, type }: TypeBadgesProps) => {
  // Debug: log the incoming type and its label so we can trace unexpected values
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Chip variant="default" className={cn(getTransactionTypeInfo(type), 'gap-1.5 rounded-md')}>
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
