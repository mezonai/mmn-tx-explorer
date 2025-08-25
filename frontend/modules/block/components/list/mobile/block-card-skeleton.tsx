import { Skeleton } from '@/components/ui/skeleton';

export const BlockCardSkeleton = () => {
  return (
    <div className="space-y-2 border-b pb-4 text-sm [&>*]:w-full">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex items-center justify-between">
        <span>Hash</span>
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex items-center justify-between">
        <span>Parent hash</span>
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex items-center justify-between">
        <span>Validator</span>
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex items-center justify-between">
        <span>Txn</span>
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  );
};
