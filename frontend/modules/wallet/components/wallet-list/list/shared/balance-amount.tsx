import { APP_CONFIG } from '@/configs/app.config';
import { NumberUtil } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface BalanceAmountProps {
  balance: number;
  showSymbol?: boolean;
  className?: string;
}

interface BalanceAmountSkeletonProps {
  className?: string;
}

export const BalanceAmount = ({ balance, className, showSymbol = true }: BalanceAmountProps) => {
  return (
    <span className={className}>
      {NumberUtil.formatWithCommas(balance)} {showSymbol && APP_CONFIG.CHAIN_SYMBOL}
    </span>
  );
};

export const BalanceAmountSkeleton = ({ className }: BalanceAmountSkeletonProps) => {
  return <Skeleton className={`h-5 w-24 ${className}`} />;
};
