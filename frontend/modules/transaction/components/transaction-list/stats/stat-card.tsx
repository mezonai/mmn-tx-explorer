import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value?: number | string;
  subValue: string;
}

export const StatCard = ({ title, value, subValue }: StatCardProps) => {
  const isLoading = value === undefined;
  const cardClassName = cn('p-0', isLoading ? 'bg-background' : 'bg-brand-primary');
  return (
    <Card className={cardClassName}>
      <CardContent className="space-y-2 p-5">
        <p className="text-tertiary-600 text-sm font-medium">{title}</p>
        {isLoading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div>
            <span className="text-3xl font-semibold">{value}</span>
            <span>&nbsp;</span>
            <span className="text-base font-medium">{subValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
