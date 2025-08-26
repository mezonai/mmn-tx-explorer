import { Transaction } from '@/assets/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { FromToAddressesSkeleton, MoreInfoButtonSkeleton, TxnHashLinkSkeleton, TypeBadgesSkeleton } from '../shared';

export const TransactionCardSkeleton = () => {
  return (
    <div className="flex flex-col items-start gap-2 border-b pb-4 xl:flex-row xl:items-center xl:gap-4">
      <div className="hidden xl:block">
        <MoreInfoButtonSkeleton />
      </div>

      <div className="w-full flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
          <TypeBadgesSkeleton />
          <div className="block xl:hidden">
            <MoreInfoButtonSkeleton />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Transaction className="text-muted-foreground size-6" />
          <TxnHashLinkSkeleton />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>

      <FromToAddressesSkeleton />

      <div className="flex w-full justify-between gap-2 text-sm font-medium xl:w-auto xl:justify-center">
        <div className="flex w-full justify-between gap-2">
          <span>Value</span>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
};
