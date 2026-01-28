import { Chip } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ETransferType, getTransactionTypeLabel } from '@/modules/transaction';
import { getTransactionTypeIcon, getTransactionTypeInfo } from '@/utils/transaction-utils';

interface TypeBadgesProps {
  type: ETransferType;
  className?: string;
}

interface TypeBadgesSkeletonProps {
  className?: string;
}

export const TypeBadges = ({ className, type }: TypeBadgesProps) => {
  const info = getTransactionTypeIcon(type);
  const TypeIcon = info.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Chip variant="default" className={cn(getTransactionTypeInfo(type), 'gap-2 rounded-md')}>
        <TypeIcon className={cn('size-3', info.iconColor)} strokeWidth={1.5} />
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
