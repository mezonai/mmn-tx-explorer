import { ComponentType, SVGProps } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  value?: string | number;
  subValue?: string;
  className?: string;
}

export const StatCard = ({ icon: Icon, title, value, subValue, className }: StatCardProps) => {
  const isLoading = value === undefined;
  const cardClassName = cn('p-0', isLoading ? 'bg-background' : 'bg-card', 'dark:border-primary/15', className);
  return (
    <Card className={cardClassName}>
      <CardContent className="space-y-5 p-5">
        {Icon && (
          <div className="bg-background dark:bg-brand-primary-background w-fit rounded-lg border p-3">
            <Icon className="text-foreground-secondary-700 size-6" strokeWidth={2} />
          </div>
        )}
        <div className="space-y-2 font-semibold">
          <p className="dark:text-card-foreground text-xs text-gray-500">{title}</p>
          {isLoading ? (
            <Skeleton className="h-9 w-28" />
          ) : (
            <div className="relative flex items-baseline whitespace-nowrap">
              <span className="text-foreground text-2xl font-bold">{value}</span>
              <span>&nbsp;</span>
              <span className="text-card-foreground text-sm font-medium">{subValue}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
