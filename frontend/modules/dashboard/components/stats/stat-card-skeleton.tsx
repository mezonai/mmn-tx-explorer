import { ComponentType } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardSkeletonProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
}

export const StatCardSkeleton = ({ icon: Icon, title }: StatCardSkeletonProps) => {
  return (
    <Card className="bg-background p-0">
      <CardContent className="space-y-5 p-5">
        <div className="bg-background w-fit rounded-lg border p-3">
          <Icon className="size-6" />
        </div>
        <div className="space-y-2 font-semibold">
          <p className="text-sm">{title}</p>
          <Skeleton className="h-9 w-28" />
        </div>
      </CardContent>
    </Card>
  );
};
