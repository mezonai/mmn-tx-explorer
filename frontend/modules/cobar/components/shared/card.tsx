import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { APP_CONFIG } from '@/configs/app.config';

interface CardProps {
  icon?: ReactNode;
  iconBg?: string;
  title?: string | ReactNode;
  price?: string | ReactNode;
  description?: string | ReactNode;
  badge?: string | ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function Card({ icon, iconBg, title, price, description, badge, children, className = '' }: CardProps) {
  return (
    <div
      className={cn(
        'border-line bg-background dark:bg-brand-primary/5 shadow-brand-primary/10 mt-3 rounded-2xl border p-5 shadow-md',
        className
      )}
    >
      <div className="flex items-start gap-4 p-2">
        {icon && <div className={cn('grid h-10 w-10 place-items-center rounded-md', iconBg)}>{icon}</div>}

        <div className="flex-1">
          {title && <h3 className="font-semibold">{title}</h3>}
          {price && (
            <div className="mt-1 flex flex-row gap-2 text-sm">
              <p>Price: </p>
              <p className="text-foreground font-semibold">
                {price} {APP_CONFIG.CHAIN_SYMBOL}
              </p>
            </div>
          )}
          {description && <p className="mt-1 mb-5 text-sm text-gray-600 dark:text-gray-400">{description}</p>}

          {badge && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="bg-primary-50 text-primary dark:bg-dBg rounded-md px-2 py-1">{badge}</span>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
