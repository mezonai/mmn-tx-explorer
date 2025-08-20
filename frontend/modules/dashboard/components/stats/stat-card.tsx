import { ComponentType } from 'react';

import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}

export const StatCard = ({ title, value, icon: Icon }: StatCardProps) => {
  return (
    <Card className="bg-primary/8 p-0">
      <CardContent className="space-y-5 p-5">
        <div className="bg-background w-fit rounded-lg border p-3">
          <Icon className="size-6" />
        </div>
        <div className="space-y-2 font-semibold">
          <p className="text-sm">{title}</p>
          <p className="text-3xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};
