import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export const SectionHeader = ({ title, subtitle, action, className }: SectionHeaderProps) => {
  return (
    <div className={cn("mb-5 flex items-center justify-between", className)}>
      <div>
        <h2 className="m-0 text-[1.3rem] font-semibold text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};