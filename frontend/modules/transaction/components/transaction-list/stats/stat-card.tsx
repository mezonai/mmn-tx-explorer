import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: number;
}

export const StatCard = ({ title, value }: StatCardProps) => {
  return (
    <Card className="bg-primary/8 p-0">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm font-medium">{title}</p>
        <span className="text-3xl font-semibold">{value}</span>
      </CardContent>
    </Card>
  );
};
