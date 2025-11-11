import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ETransactionStatus, ETransactionType, getTransactionTypeLabel } from '@/modules/transaction';
import { TxStatusBadge } from '@/modules/transaction/components/shared';

interface TypeBadgesProps {
  type: ETransactionType;
  status: ETransactionStatus;
  className?: string;
}

interface TypeBadgesSkeletonProps {
  className?: string;
}

const getTransactionTypeInfo = (type: ETransactionType) => {
  switch (type) {
    case ETransactionType.TokenTransfer:
      return { color: 'bg-orange-500/20 text-orange-400 border-0' };
  }
};

export const TypeBadges = ({ className, type, status }: TypeBadgesProps) => {
  const typeInfo = getTransactionTypeInfo(type);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('px-2 py-1 rounded text-xs', typeInfo.color)}>
        {getTransactionTypeLabel(type)}
      </span>

      <TxStatusBadge status={status} />
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
