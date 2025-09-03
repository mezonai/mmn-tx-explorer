import { CheckCircle, Clock, InfoSquare } from '@/assets/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ETransactionStatus, getTransactionStatusLabel } from '@/modules/transaction';

const getTransactionStatusInfo = (status: ETransactionStatus) => {
  switch (status) {
    case ETransactionStatus.Pending:
      return {
        icon: Clock,
        iconColor: 'text-yellow-600',
      };
    case ETransactionStatus.Confirmed:
      return {
        icon: CheckCircle,
        iconColor: 'text-green-600',
      };
    case ETransactionStatus.Finalized:
      return {
        icon: InfoSquare,
        iconColor: 'text-blue-600',
      };
    case ETransactionStatus.Failed:
      return {
        icon: InfoSquare,
        iconColor: 'text-red-600',
      };
  }
};

interface TxStatusBadgeProps {
  status: ETransactionStatus;
}

export const TxStatusBadge = ({ status }: TxStatusBadgeProps) => {
  const statusInfo = getTransactionStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  return (
    <Badge variant="outline">
      <StatusIcon className={cn('size-3', statusInfo.iconColor)} strokeWidth={1.5} />
      <span className="text-xs font-medium whitespace-nowrap">{getTransactionStatusLabel(status)}</span>
    </Badge>
  );
};
