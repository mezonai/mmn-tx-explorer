import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  changePercent?: string;
  changeLabel?: string;
  isPositive?: boolean;
  className?: string;
}

export const MetricCard = ({ 
  label, 
  value, 
  changePercent, 
  changeLabel = '24h',
  isPositive = true, 
  className 
}: MetricCardProps) => {
  return (
    <article className={cn(
      "border-primary from-primary/2 to-primary/20 relative overflow-hidden rounded-[20px] border bg-gradient-to-b p-[20px_22px]",
      className
    )}>
      <span className="mb-3 block text-[0.85rem] text-[var(--color-text-muted)]">{label}</span>
      <p className="text-primary m-0 text-[1.8rem] font-semibold">{value}</p>
      {changePercent && (
        <span className={cn(
          "mt-[14px] inline-flex items-center gap-2 text-[0.85rem]",
          isPositive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
        )}>
          {changePercent} / {changeLabel}
        </span>
      )}
    </article>
  );
};