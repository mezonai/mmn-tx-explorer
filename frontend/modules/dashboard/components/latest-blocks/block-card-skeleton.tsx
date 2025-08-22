import { Cube01 } from '@/assets/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const BlockCardSkeleton = () => {
  return (
    <Card className="p-0">
      <CardContent className="p-5">
        <div className="mb-3 flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Cube01 className="text-primary size-6" />
            <Skeleton className="h-9 w-16" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-2 text-sm font-medium">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Txn</span>
            <Skeleton className="h-5 w-8" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Validator</span>
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
