import { Skeleton } from '@/components/ui/skeleton';
import { APP_CONFIG } from '@/configs/app.config';
import { cn } from '@/lib/utils';
import { NumberUtil } from '@/utils';

interface TransactionValueProps {
  value: string;
  className?: string;
  showLabel?: boolean;
  showSymbol?: boolean;
}

interface TransactionValueSkeletonProps {
  className?: string;
  showLabel?: boolean;
}

export const TransactionValue = ({
  value,
  className,
  showLabel = false,
  showSymbol = false,
}: TransactionValueProps) => {
  const formattedValue = `${NumberUtil.formatWithCommas(value)} ${showSymbol ? APP_CONFIG.CHAIN_SYMBOL : ''}`;

  if (showLabel) {
    return (
      <div className={cn('flex w-full justify-between gap-2 text-sm font-medium', className)}>
        <span className="text-secondary-700">Value</span>
        <span className="text-tertiary-600 font-normal">{formattedValue}</span>
      </div>
    );
  }

  return <span className={className}>{formattedValue}</span>;
};

export const TransactionValueSkeleton = ({ className, showLabel = false }: TransactionValueSkeletonProps) => {
  if (showLabel) {
    return (
      <div className={cn('flex w-full justify-between gap-2 text-sm font-medium', className)}>
        <span className="text-secondary-700">Value</span>
        <Skeleton className="h-5 w-24" />
      </div>
    );
  }

  return <Skeleton className={cn('h-5 w-20', className)} />;
};
