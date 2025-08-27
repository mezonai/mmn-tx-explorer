import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const StatCardSkeleton = () => {
  return (
    <Card className="bg-background p-0">
      <CardContent className="space-y-2 p-5">
        <Skeleton className="h-5 w-50" />
        <Skeleton className="h-[36px] w-10" />
      </CardContent>
    </Card>
  );
};
