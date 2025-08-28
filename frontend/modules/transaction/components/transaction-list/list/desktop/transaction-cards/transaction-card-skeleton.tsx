import { Skeleton } from '@/components/ui/skeleton';
import { FromToAddressesSkeleton, MoreInfoButtonSkeleton, TxnHashLinkSkeleton, TypeBadgesSkeleton } from '../../shared';

export const TransactionCardSkeleton = () => {
  return (
    <div className="border-secondary grid grid-cols-[1fr_12fr_6fr_4fr] border-b">
      <div className="flex items-center justify-center">
        <MoreInfoButtonSkeleton />
      </div>

      <div className="space-y-2 px-4 py-3">
        <TypeBadgesSkeleton />
        <div className="flex items-center gap-2">
          <TxnHashLinkSkeleton />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>

      <div className="flex items-center px-4 py-3">
        <FromToAddressesSkeleton orientation="vertical" />
      </div>

      <div className="flex items-center px-4 py-3">
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  );
};
