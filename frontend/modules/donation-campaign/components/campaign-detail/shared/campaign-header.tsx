'use client';
import { ProgressCard } from './progress-card';
import { InsightsCard } from './insights-card';
import { DonationCampaign } from '@/modules/donation-campaign/type';
import { Chip } from '@/components/shared';
import { getCampaignStatusLabel, getCampaignStatusVariant } from '@/modules/donation-campaign/utils';
import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';

export function CampaignHeader({ campaign }: { campaign: DonationCampaign }) {
  const [currentCampaign, setCurrentCampaign] = useState(campaign);

  const handleRefreshData = (newRaisedAmount?: number) => {
    if (newRaisedAmount !== undefined) {
      setCurrentCampaign((prev) => ({
        ...prev,
        total_amount: newRaisedAmount,
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
      <h1 className="text-3xl font-bold">{currentCampaign.name}</h1>
      <p className="text-muted-foreground max-w-2xl break-words">{currentCampaign.description}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProgressCard
          raised={currentCampaign.total_amount}
          goal={currentCampaign.goal}
          campaignId={currentCampaign.id}
          onRefresh={handleRefreshData}
        />
        <InsightsCard
          contributors={currentCampaign.total_contributors}
          daysRemaining={currentCampaign.end_date}
          owner={currentCampaign.owner}
        />
      </div>
    </div>
  );
}
