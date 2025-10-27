import { Users, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Giả sử đường dẫn này là chính xác

export function InsightsCard({
  contributors,
  daysRemaining,
  owner,
}: {
  contributors: number;
  daysRemaining: number;
  owner: { name: string; wallet: string; verified: boolean };
}) {
  return (
    <Card className="dark:bg-dark-light/80 rounded-3xl border-gray-200 bg-white/90 shadow-sm dark:border-white/10">
      <CardHeader>
        <CardTitle className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
          Campaign insights
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <dl className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Users className="text-primary h-4 w-4" />
              <span>Contributors</span>
            </dt>
            <dd className="font-semibold text-gray-900 dark:text-white">{contributors} supporters</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Clock className="text-primary h-4 w-4" />
              <span>Time remaining</span>
            </dt>
            <dd className="font-semibold text-gray-900 dark:text-white">{daysRemaining} days</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <ShieldCheck className="text-primary h-4 w-4" />
              <span>Campaign owner</span>
            </dt>
            <dd className="font-semibold text-gray-900 dark:text-white">
              <span>{owner.name}</span>
              {owner.verified && <span className="text-primary dark:text-primary-light ml-1 text-xs">✔</span>}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
