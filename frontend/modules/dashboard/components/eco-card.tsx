import { Chip } from '@/components/shared';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface EcoCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  ref?: React.Ref<HTMLAnchorElement>;
  route?: string;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const EcoCard = ({
  title,
  description,
  icon,
  comingSoon = false,
  ref,
  route,
  isLoading = false,
  className,
  children,
}: EcoCardProps) => {
  return (
    <Link
      ref={ref}
      href={comingSoon ? '#' : route || ''}
      className={cn(
        `bg-card ${comingSoon ? 'cursor-default' : 'hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer'} block rounded-xl border border-gray-300 p-6 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:border-gray-700 dark:bg-slate-800 dark:shadow-sm ${className}`
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold">{title}</span>

        <div className="flex items-center gap-2">
          {comingSoon && (
            <Chip variant="warning" size="sm">
              Coming Soon
            </Chip>
          )}
          {icon}
        </div>
      </div>
      {isLoading ? (
        <div>
          <Skeleton className="mb-3 h-4 w-56 bg-gray-200 dark:bg-gray-700" />
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <Skeleton className="h-2 w-1/2 bg-brand-primary" />
          </div>
        </div>
      ) : (
        <>{children || (description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>)}</>
      )}
    </Link>
  );
};
