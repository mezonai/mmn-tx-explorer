'use client';
import { ProgressCard } from './progress-card';
import { InsightsCard } from './insights-card';
import { DonationCampaign } from '@/modules/donation-campaign/type';
import { Chip } from '@/components/shared';
import { getCampaignStatusVariant } from '@/modules/donation-campaign/utils';

export function CampaignHeader({ campaign }: { campaign: DonationCampaign }) {
  const status = campaign.status;
  const capitalizedStatus = getCampaignStatusVariant(status);

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
          daysRemaining={campaign.end_date}
          owner={campaign.creator}
        />
      </div>
    </div>
  );
}
