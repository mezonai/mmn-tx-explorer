import { cn } from '@/lib/utils';
interface PageHeaderProps {
  title?: string;
  header?: string;
  description?: string;
  className?: string;
}

export const PageHeader = ({ title, header, className = '', description = '' }: PageHeaderProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      {title && <h6 className="text-brand-primary text-xs font-semibold tracking-[0.3em] uppercase">{title}</h6>}

      {header && <h1 className="text-primary mt-3 text-4xl font-bold dark:text-white">{header}</h1>}

      {description && <p className="mt-4 max-w-2xl text-sm text-gray-800 dark:text-white">{description}</p>}
    </div>
  );
};
