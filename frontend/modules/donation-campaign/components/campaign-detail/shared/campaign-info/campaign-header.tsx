'use client';
import { ProgressCard } from './progress-card';
import { InsightsCard } from './insights-card';
import { DonationCampaign } from '@/modules/donation-campaign/type';
import { Chip } from '@/components/shared';
import { getCampaignStatusLabel, getCampaignStatusVariant } from '@/modules/donation-campaign/utils';
import Link from 'next/link';
import { ROUTES } from '@/configs/routes.config';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { useUser } from '@/providers';
import { DescriptionDisplay } from '@/components/shared';

export function CampaignHeader({ campaign }: { campaign: DonationCampaign }) {
  const [currentCampaign, setCurrentCampaign] = useState(campaign);
  const { user } = useUser();

  const handleRefreshData = (newRaisedAmount?: number, newCurrentBalance?: number, newTotalWithdrawn?: number) => {
    if (newRaisedAmount !== undefined) {
      setCurrentCampaign((prev) => ({
        ...prev,
        total_amount: newRaisedAmount,
      }));
    }
    if (newCurrentBalance !== undefined) {
      setCurrentCampaign((prev) => ({
        ...prev,
        current_balance: newCurrentBalance,
      }));
    }
    if (newTotalWithdrawn !== undefined) {
      setCurrentCampaign((prev) => ({
        ...prev,
        total_withdrawn: newTotalWithdrawn,
      }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Chip variant={getCampaignStatusVariant(campaign.status)}>{getCampaignStatusLabel(campaign.status)}</Chip>
        {campaign.verified && (
          <Chip variant="brand">
            <span>Verified</span>
            <BadgeCheck size={18} className="ml-2 fill-emerald-400" color="white" />
          </Chip>
        )}
      </div>

      <div className="flex flex-row items-center space-x-2">
        <h1 className="text-3xl font-bold">{campaign.name}</h1>
        {user?.id === campaign.creator && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={ROUTES.CAMPAIGN_EDIT(campaign.slug)}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit campaign"
                  title="Edit campaign"
                  className="dark:hover:bg-brand-primary/20"
                >
                  <Pencil className="h-5 w-5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Edit campaign</TooltipContent>
          </Tooltip>
        )}
      </div>

      <DescriptionDisplay description={campaign.description} className="text-muted-foreground text-md max-w-2xl" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProgressCard
          raised={currentCampaign.total_amount}
          goal={currentCampaign.goal}
          campaignId={currentCampaign.id}
          currentBalance={currentCampaign.current_balance}
          totalWithdrawn={currentCampaign.total_withdrawn}
          onRefresh={handleRefreshData}
        />
        <InsightsCard currentCampaign={currentCampaign} />
      </div>
    </div>
  );
}
