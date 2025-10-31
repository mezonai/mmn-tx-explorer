'use client';
import { ProgressCard } from './progress-card';
import { InsightsCard } from './insights-card';
import { DonationCampaign } from '@/modules/donation-campaign/type';
import { Chip } from '@/components/shared';
import { getCampaignStatusLabel, getCampaignStatusVariant } from '@/modules/donation-campaign/utils';
import Link from 'next/link';
import { ROUTES } from '@/configs/routes.config';
import { InfoSquare } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger } from '@radix-ui/react-tooltip';

export function CampaignHeader({ campaign }: { campaign: DonationCampaign }) {
  const status = campaign.status;
  const capitalizedStatus = getCampaignStatusLabel(status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Chip variant={getCampaignStatusVariant(status)}>{capitalizedStatus}</Chip>
      </div>

      <div className="flex flex-row items-center space-x-2">
        <h1 className="text-3xl font-bold">{campaign.name}</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={ROUTES.CAMPAIGN_EDIT(campaign.id)}>
              <Button variant="ghost" size="icon" aria-label="Edit campaign" title="Edit campaign">
                <InfoSquare className="h-5 w-5 text-gray-500" />
              </Button>
            </Link>
          </TooltipTrigger>
        </Tooltip>
      </div>
      <p className="text-muted-foreground max-w-2xl">{campaign.description}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProgressCard raised={campaign.total_amount} goal={campaign.goal} />
        <InsightsCard
          contributors={campaign.total_contributors}
          daysRemaining={campaign.end_date}
          owner={campaign.owner}
        />
      </div>
    </div>
  );
}
