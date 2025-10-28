'use client';
import { ProgressCard } from './progress-card';
import { InsightsCard } from './insights-card';
import { ECampaignStatus, DonationCampaign } from '@/modules/donation-campaign/type';
import { useMemo } from 'react';
import { Chip } from '@/components/shared';
import { getCampaignStatusVariant, getDaysRemaining } from '@/modules/donation-campaign/utils';

export function CampaignHeader({ campaign }: { campaign: DonationCampaign }) {
  const status = campaign.status;
  const capitalizedStatus = useMemo(() => {
    if (status === ECampaignStatus.Active) return 'Active';
    if (status === ECampaignStatus.Draft) return 'Draft';
    if (status === ECampaignStatus.Closed) return 'Closed';
    return 'Unknown';
  }, [status]);
  const daysRemaining = getDaysRemaining(campaign.created_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Chip variant={getCampaignStatusVariant(status)}>{capitalizedStatus}</Chip>
      </div>

      <h1 className="text-3xl font-bold">{campaign.name}</h1>
      <p className="text-muted-foreground max-w-2xl">{campaign.description}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProgressCard raised={campaign.total_amount} goal={campaign.goal} />
        <InsightsCard
          contributors={campaign.total_contributors}
          daysRemaining={daysRemaining}
          owner={campaign.creator}
        />
      </div>
    </div>
  );
}
