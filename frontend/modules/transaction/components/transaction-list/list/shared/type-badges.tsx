import { CheckCircle, Clock, InfoSquare } from '@/assets/icons';
import { Badge } from '@/components/ui/badge';
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

const getTransactionTypeInfo = (type: ETransactionType) => {
  switch (type) {
    case ETransactionType.TokenTransfer:
      return { color: 'bg-orange-50 border-orange-200 text-orange-700' };
  }
};

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
        iconColor: 'text-red-600',
      };
    case ETransactionStatus.Failed:
      return {
        icon: InfoSquare,
        iconColor: 'text-red-600',
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
        <span className="text-xs font-medium whitespace-nowrap">{getTransactionStatusLabel(status)}</span>
      </Badge>
    </div>
  );
};
