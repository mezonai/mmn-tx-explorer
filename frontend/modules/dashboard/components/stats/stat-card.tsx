import { ComponentType } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { NumberUtil } from '@/utils';

interface StatCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
}

export const StatCard = ({ icon: Icon, title, value }: StatCardProps) => {
  return (
    <Card className="bg-primary/8 p-0">
      <CardContent className="space-y-5 p-5">
        <div className="bg-background w-fit rounded-lg border p-3">
          <Icon className="size-6" />
        </div>
        <div className="space-y-2 font-semibold">
          <p className="text-sm">{title}</p>
          <p className="text-3xl">{NumberUtil.formatWithCommas(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
};
