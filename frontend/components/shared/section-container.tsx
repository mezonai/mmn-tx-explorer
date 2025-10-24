import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'primary-bg';
}

export const SectionContainer = ({ 
  children, 
  className, 
  variant = 'default' 
}: SectionContainerProps) => {
  const baseClasses = "mb-8 rounded-[24px] border p-[24px_28px] shadow-[var(--shadow-soft)]";
  const variantClasses = {
    default: "border-primary bg-primary/5",
    'primary-bg': "border-primary from-primary/2 to-primary/20 bg-gradient-to-br"
  };

  return (
    <section className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </section>
  );
};