import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { APP_CONFIG } from '@/configs/app.config';
import { NumberUtil } from '@/utils';

export function ProgressCard({ raised, goal }: { raised: number; goal: number }) {
  const raisedScaleDown = Number(NumberUtil.formatWithCommasAndScale(raised).replace(/,/g, ''));
  const progress = (raisedScaleDown / goal) * 100;
  return (
    <Card className="dark:bg-dark dark:bg-card rounded-3xl border-gray-200 bg-white/90 shadow-sm dark:border-white/10">
      <CardContent>
        <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Raised to date</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {NumberUtil.formatWithCommasAndScale(raised)}
          <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">{APP_CONFIG.CHAIN_SYMBOL}</span>
        </p>
        <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="bg-brand-primary h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Goal {NumberUtil.formatWithCommas(goal)} {APP_CONFIG.CHAIN_SYMBOL}
        </span>
        <span>{progress.toFixed(2)}% funded</span>
      </CardFooter>
    </Card>
  );
}
