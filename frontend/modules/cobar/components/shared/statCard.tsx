import { Currency } from 'lucide-react';
import Card from './card';

interface StatCardProps {
  title: string;
  value: string | number;
  percentage: string | number;
  time?: string;
  currency?: string;
  className?: string;
}

export const StatCard = ({ title, value, percentage, time, currency, className = '' }: StatCardProps) => {
  return (
    <Card className={className}>
      <div className="flex w-full flex-col">
        <h4 className="text-sm text-gray-400">{title}</h4>
        <div className="flex items-baseline gap-2">
          <span className="my-2 text-4xl font-bold">{value}</span>
          {currency && <p>{currency}</p>}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-utility-success-600 text-sm font-medium">+{percentage}%</span>
          {time && <p className="mt-1 text-xs text-gray-400">| {time}</p>}
        </div>
      </div>
    </Card>
  );
};
