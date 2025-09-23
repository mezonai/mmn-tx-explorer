import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Breadcrumb + Title */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-8 w-64" />
      </div>

      {/* Tabs header */}
      <div className="flex w-full flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-md" />
        {/* <Skeleton className="h-8 w-24 rounded-md" /> */}
      </div>

      {/* Details content card skeleton */}
      <div className="rounded-xl border bg-card p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-60" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
