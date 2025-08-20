import { Line } from 'rc-progress';

import { cn } from '@/lib/utils';
import { NumberUtil } from '@/utils';

interface GasUsageProps {
  gasUsed: string;
  gasLimit: string;
  className?: string;
}

export const GasUsage = ({ gasUsed, gasLimit, className }: GasUsageProps) => {
  const percent = Number(gasLimit) === 0 ? 0 : (Number(gasUsed) / Number(gasLimit)) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <span>{gasUsed}</span>
      <div className="flex items-center gap-3">
        <Line
          percent={percent}
          strokeWidth={10}
          trailWidth={10}
          strokeColor="var(--muted-foreground)"
          className="w-20"
        />
        <span>{NumberUtil.format(percent, 2)}%</span>
      </div>
    </div>
  );
};
