import Card from './card';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string | number;
  className?: string;
  isLoading?: boolean;
}

export const StatCard = ({ title, value, subValue, className = '', isLoading }: StatCardProps) => {
  return (
    <Card className={className}>
      <div className="flex w-full flex-col">
        {isLoading ? (
          <div className="bg-brand-primary/10 h-10 w-full animate-pulse rounded-md"></div>
        ) : (
          <>
            <h4 className="text-sm text-gray-400">{title}</h4>
            <div className="flex items-baseline gap-2">
              <span className="my-2 text-3xl font-bold">{value}</span>
              {subValue && <span className="text-md text-foreground">{subValue}</span>}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
