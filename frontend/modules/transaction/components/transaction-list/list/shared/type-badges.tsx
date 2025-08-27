import { TxStatusBadge } from '@/components/shared/tx-status-badge';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ETransactionStatus, ETransactionType, getTransactionTypeLabel } from '@/modules/transaction';

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
      return { color: 'bg-orange-50 border-orange-200 text-orange-700' };
  }
};

export const TypeBadges = ({ className, type, status }: TypeBadgesProps) => {
  const typeInfo = getTransactionTypeInfo(type);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant="outline" className={cn(typeInfo.color)}>
        <span className="text-xs font-medium whitespace-nowrap">{getTransactionTypeLabel(type)}</span>
      </Badge>

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
