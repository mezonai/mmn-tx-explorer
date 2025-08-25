import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  subValue: string;
}

export const StatCard = ({ title, value, subValue }: StatCardProps) => {
  return (
    <Card className="bg-primary/8 p-0">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm font-medium">{title}</p>
        <div>
          <span className="text-3xl font-semibold">{value}</span>
          <span>&nbsp;</span>
          <span className="text-sm">{subValue}</span>
        </div>
      </CardContent>
    </Card>
  );
};
