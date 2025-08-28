import { AlertCircle, CheckCircle, XCircle } from '@/assets/icons';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ETransactionStatus,
  ETransactionType,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
} from '@/modules/transaction';

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
      return { color: 'bg-utility-warning-50 border-utility-warning-200 text-utility-warning-700' };
  }
};

const getTransactionStatusInfo = (status: ETransactionStatus) => {
  switch (status) {
    case ETransactionStatus.Pending:
      return {
        icon: AlertCircle,
        iconColor: 'text-utility-warning-600',
      };
    case ETransactionStatus.Confirmed:
      return {
        icon: CheckCircle,
        iconColor: 'text-utility-success-600',
      };
    case ETransactionStatus.Passed:
      return {
        icon: CheckCircle,
        iconColor: 'text-utility-success-600',
      };
    case ETransactionStatus.Failed:
      return {
        icon: XCircle,
        iconColor: 'text-utility-error-600',
      };
  }
};

export const TypeBadges = ({ className, type, status }: TypeBadgesProps) => {
  const typeInfo = getTransactionTypeInfo(type);
  const statusInfo = getTransactionStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant="outline" className={cn(typeInfo.color)}>
        <span className="text-xs font-medium whitespace-nowrap">{getTransactionTypeLabel(type)}</span>
      </Badge>

      <Badge variant="outline">
        <StatusIcon className={cn('size-3', statusInfo.iconColor)} strokeWidth={1.5} />
        <span className="text-secondary-700 text-xs font-medium whitespace-nowrap">
          {getTransactionStatusLabel(status)}
        </span>
      </Badge>
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
