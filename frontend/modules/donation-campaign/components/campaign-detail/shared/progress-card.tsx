import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { APP_CONFIG } from '@/configs/app.config';
import { NumberUtil } from '@/utils';

export function ProgressCard({ raised, goal }: { raised: number; goal: number }) {
  const progress = Math.min((raised / 1000000 / goal) * 100, 100);
  return (
    <Card className="dark:bg-dark-light/80 rounded-3xl border-gray-200 bg-white/90 shadow-sm dark:border-white/10">
      <CardContent>
        <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Raised to date</p>

        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {NumberUtil.formatWithCommasAndScale(raised)}
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{APP_CONFIG.CHAIN_SYMBOL}</span>
        </p>

        <div className="mt-4 h-2 w-full rounded-full bg-gray-100 dark:bg-white">
          <div
            className="from-primary to-primary-light h-full rounded-full bg-gradient-to-r transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Goal {NumberUtil.formatWithCommas(goal)} MMN</span>
        <span>{progress.toFixed(1)}% funded</span>
      </CardFooter>
    </Card>
  );
}
