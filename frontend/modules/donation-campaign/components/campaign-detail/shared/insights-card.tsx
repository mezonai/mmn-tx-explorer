import { Users, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimeUtil } from '@/utils/date-time.util';
import { useMemo } from 'react';
import { TransferDialog } from './transfer-dialog';
import { useUser } from '@/providers';
import { DonationCampaign } from '@/modules/donation-campaign/type';

export function InsightsCard({ currentCampaign }: { currentCampaign: DonationCampaign }) {
  const { user } = useUser();

  const timeRemainingDisplay = useMemo(() => {
    if (!currentCampaign.end_date) {
      return 'No deadline';
    }
    return DateTimeUtil.safeFormatDistanceToNow(new Date(currentCampaign.end_date));
  }, [currentCampaign.end_date]);

  return (
    <Card className="dark:bg-card rounded-3xl border-gray-200 bg-white/90 shadow-sm dark:border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Campaign insights
          </CardTitle>
          {currentCampaign.donation_wallet && user?.id === currentCampaign.creator && (
            <div className="-mr-2">
              <TransferDialog
                currentCampaign={currentCampaign}
                walletAddress={currentCampaign.donation_wallet}
                raisedAmount={currentCampaign.total_amount}
                myWalletAddress={user?.walletAddress}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <dl className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Users className="text-brand-primary h-4 w-4" />
              <span>Contributors</span>
            </dt>
            <dd className="font-bold text-gray-900 dark:text-white">{currentCampaign.total_contributors} supporters</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Clock className="text-brand-primary h-4 w-4" />
              <span>Time remaining</span>
            </dt>
            <dd className="font-bold text-gray-900 dark:text-white">{timeRemainingDisplay}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <ShieldCheck className="text-brand-primary h-4 w-4" />
              <span>Campaign owner</span>
            </dt>
            <dd className="font-bold text-gray-900 dark:text-white">
              <span>{currentCampaign.owner || ''}</span>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
