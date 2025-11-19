import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  icon?: ReactNode;
  iconBg?: string;
  title?: string | ReactNode;
  quantity?: string | ReactNode;
  description?: string | ReactNode;
  children?: ReactNode;
  className?: string;
  isLoading?: boolean;
}

export default function Card({
  icon,
  iconBg,
  title,
  quantity,
  description,
  children,
  className = '',
  isLoading,
}: CardProps) {
  return (
    <div
      className={cn(
        'border-line bg-background dark:bg-brand-primary/5 shadow-brand-primary/10 rounded-2xl border shadow-md lg:p-4',
        className
      )}
    >
      {isLoading ? (
        <div className="bg-brand-primary/10 h-24 w-full animate-pulse rounded-md"></div>
      ) : (
        <div className="flex items-start gap-4 p-2">
          {icon && <div className={cn('grid h-10 w-10 place-items-center rounded-md', iconBg)}>{icon}</div>}

          <div className="flex-1">
            {title && <h3 className="font-semibold">{title}</h3>}
            {quantity && (
              <div className="mt-1 flex flex-row gap-2 text-sm">
                <p>Sold: </p>
                <p className="text-foreground">{quantity}</p>
              </div>
            )}
            {description && <p className="mt-1 mb-5 text-sm text-gray-600 dark:text-gray-400">{description}</p>}

            {children}
          </div>
        </div>
      )}
    </div>
  );
}
