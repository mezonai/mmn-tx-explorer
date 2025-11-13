import { AlertCircle, CheckCircle, XCircle } from '@/assets/icons';
import { Chip } from '@/components/shared';
import { cn } from '@/lib/utils';
import { ETransactionStatus, getTransactionStatusLabel, getTransactionStatusVariant } from '@/modules/transaction';

interface TxStatusBadgeProps {
  status: ETransactionStatus;
}

const getTransactionStatusIcon = (status: ETransactionStatus) => {
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
  const statusInfo = getTransactionStatusIcon(status);
  const StatusIcon = statusInfo.icon;

  return (
    <>
      <Chip variant={getTransactionStatusVariant(status)} className="gap-1.5">
        <StatusIcon className={cn('size-3', statusInfo.iconColor)} strokeWidth={1.5} />
        <span>{getTransactionStatusLabel(status)}</span>
      </Chip>
    </>
  );
};
