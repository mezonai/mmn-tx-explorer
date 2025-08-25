import { Transaction } from '@/assets/icons';
import { Skeleton } from '@/components/ui/skeleton';

export const TransactionCardSkeleton = () => {
  return (
    <div className="flex flex-col items-start gap-2 border-b pb-4 xl:flex-row xl:items-center xl:gap-4">
      <div className="hidden xl:block">
        <Skeleton className="size-9 rounded-md" />
      </div>

      <div className="w-full flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Skeleton className="h-[26px] w-28 rounded-lg" />
            <Skeleton className="h-[26px] w-20 rounded-lg" />
          </div>
          <div className="block xl:hidden">
            <Skeleton className="size-9 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Transaction className="text-muted-foreground size-6" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-10" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex w-full items-center gap-2">
          <div className="hidden lg:block">
            <Skeleton className="size-4 rounded-sm" />
          </div>
          <div className="flex flex-1 flex-row gap-3 lg:flex-col">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-6 rounded-md" />
            </div>
            <div className="flex items-center justify-center lg:hidden">
              <Skeleton className="size-4 rounded-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-6 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full justify-between gap-2 text-sm font-medium xl:w-auto xl:justify-center">
        <div className="flex w-full justify-between gap-2">
          <span>Value</span>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
};
