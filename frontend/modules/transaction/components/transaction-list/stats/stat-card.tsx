import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value?: number;
  subValue: string;
}

export const StatCard = ({ title, value, subValue }: StatCardProps) => {
  const isLoading = value === undefined;

  return (
    <Card className={isLoading ? 'bg-background p-0' : 'bg-brand-primary p-0'}>
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
