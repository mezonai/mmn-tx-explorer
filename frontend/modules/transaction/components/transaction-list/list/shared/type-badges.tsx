import { Chip } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ETransactionStatus, ETransactionType, getTransactionTypeLabel } from '@/modules/transaction';
import { TxStatusBadge } from '@/modules/transaction/components/shared';

interface TypeBadgesProps {
  type: ETransactionType;
  className?: string;
}

interface TypeBadgesSkeletonProps {
  className?: string;
}

const getTransactionTypeInfo = (type: ETransactionType) => {
  switch (type) {
    case ETransactionType.TokenTransfer:
      return 'warning';
    case ETransactionType.DonationCampaign:
      return 'brand';
    case ETransactionType.WithdrawCampaign:
      return 'default';
    default:
      return 'default';
  }
};

export const TypeBadges = ({ className, type }: TypeBadgesProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Chip variant={getTransactionTypeInfo(type)} className="gap-1.5 rounded-md">
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
