'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { APP_CONFIG } from '@/configs/app.config';
import { NumberUtil } from '@/utils';
import { useMemo } from 'react';
import { useRefreshCampaignRaised } from '../../../hooks';
import { RefreshButton } from '@/components/shared';
import { DEFAULT_DEBOUNCE_TIME } from '@/hooks';

interface ProgressCardProps {
  raised: number;
  goal: number;
  campaignId: string;
  onRefresh?: (newRaisedAmount: number, newTotalAmount: number) => void;
}
export function ProgressCard({ raised, goal, campaignId, onRefresh }: ProgressCardProps) {
  const { mutate, isPending } = useRefreshCampaignRaised({
    onSuccess: ({ total_amount, total_contributors }) => {
      onRefresh?.(total_amount, total_contributors);
    },
  });

  const progress = useMemo(() => {
    const raisedScaleDown = NumberUtil.scaleDown(raised);
    if (!goal) {
      return 0;
    }
    return Number(((raisedScaleDown / goal) * 100).toFixed(2));
  }, [raised, goal]);

  return (
    <Card className="dark:bg-dark dark:bg-card gap-4 rounded-3xl border-gray-200 bg-white/90 shadow-sm dark:border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Raised to date</p>
        <RefreshButton onClick={() => mutate(campaignId)} isLoading={isPending} startDelay={DEFAULT_DEBOUNCE_TIME} />
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-3xl font-semibold text-gray-900 dark:text-white">
          {NumberUtil.formatWithCommasAndScale(raised)}
          <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">{APP_CONFIG.CHAIN_SYMBOL}</span>
        </p>
        <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="bg-brand-primary h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${!goal && !!raised ? 100 : Math.min(progress, 100)}%` }}
          />
        </div>
      </CardContent>

      <CardFooter className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Goal {NumberUtil.formatWithCommas(goal)} {APP_CONFIG.CHAIN_SYMBOL}
        </span>
        <span>{progress}% funded</span>
      </CardFooter>
    </Card>
  );
}
