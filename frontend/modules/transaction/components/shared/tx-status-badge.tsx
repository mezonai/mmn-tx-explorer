import { AlertCircle, CheckCircle, XCircle } from '@/assets/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ETransactionStatus, getTransactionStatusLabel } from '@/modules/transaction';
import { Skeleton } from '@/components/ui/skeleton';

interface TxStatusBadgeProps {
  status: ETransactionStatus;
}
interface TypeBadgesSkeletonProps {
  className?: string;
}

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

export const TxStatusBadge = ({ status }: TxStatusBadgeProps) => {
  const statusInfo = getTransactionStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  return (
    <Badge variant="outline">
      <StatusIcon className={cn('size-3', statusInfo.iconColor)} strokeWidth={1.5} />
      <span className="text-card-foreground text-xs font-medium whitespace-nowrap">
        {getTransactionStatusLabel(status)}
      </span>
    </Badge>
  );
};

export const TxStatusSkeleton = ({ className }: TypeBadgesSkeletonProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Skeleton className="h-5.5 w-24" />
      <Skeleton className="h-5.5 w-24" />
    </div>
  )
};
