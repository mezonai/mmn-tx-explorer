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
  iconClassName?: string;
}

export const StatCard = ({ icon: Icon, title, value, subValue, className, iconClassName }: StatCardProps) => {
  const isLoading = value === undefined;
  const cardClassName = cn('dark:border-primary/15 p-0', isLoading ? 'bg-background' : 'bg-card', className);

  const iconElement = Icon && (
    <div className={cn('text-foreground-secondary-700 w-fit rounded-lg border p-3', iconClassName)}>
      <Icon className="size-7" strokeWidth={2} />
    </div>
  );

  const valueElement = (
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
  );

  return (
    <Card className={cardClassName}>
      <CardContent className={cn('p-5', 'flex items-center justify-between')}>
        <>
          {valueElement}
          {iconElement}
        </>
      </CardContent>
    </Card>
  );
};
