import { AlertCircle, CheckCircle, XCircle } from '@/assets/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ETransactionStatus, getTransactionStatusLabel } from '@/modules/transaction';

interface TxStatusBadgeProps {
  status: ETransactionStatus;
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
      <span className="text-secondary-700 text-xs font-medium whitespace-nowrap">
        {getTransactionStatusLabel(status)}
      </span>
    </Badge>
  );
};
