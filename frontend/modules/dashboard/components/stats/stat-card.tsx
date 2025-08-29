import { ComponentType, SVGProps } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NumberUtil } from '@/utils';

interface StatCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  value?: number;
  subValue?: string;
}

export const StatCard = ({ icon: Icon, title, value, subValue }: StatCardProps) => {
  const isLoading = value === undefined;

  return (
    <Card className={isLoading ? 'bg-background p-0' : 'bg-brand-primary p-0'}>
      <CardContent className="space-y-5 p-5">
        <div className="bg-background w-fit rounded-lg border p-3">
          <Icon className="text-foreground-secondary-700 size-6" strokeWidth={2} />
        </div>
        <div className="space-y-2 font-semibold">
          <p className="text-tertiary-600 text-sm font-medium">{title}</p>
          {isLoading ? (
            <Skeleton className="h-9 w-28" />
          ) : (
            <div>
              <span className="text-3xl font-semibold">{NumberUtil.formatWithCommas(value ?? 0)}</span>
              <span>&nbsp;</span>
              <span className="text-base font-medium">{subValue}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
