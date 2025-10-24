import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  className?: string;
}

export const FeatureCard = ({ title, description, className }: FeatureCardProps) => {
  return (
    <div className={cn(
      "border-primary from-muted to-primary/10 bg-gradient-to-r mb-8 flex min-h-[180px] flex-col justify-between rounded-[24px] border p-[24px_28px] shadow-[var(--shadow-soft)]",
      className
    )}>
      <h3 className="text-primary text-lg font-bold">{title}</h3>
      <p className="text-primary pt-3 font-semibold">{description}</p>
    </div>
  );
};