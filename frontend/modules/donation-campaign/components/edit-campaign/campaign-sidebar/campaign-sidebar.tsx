'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUpdateCampaignContext } from '@/modules/donation-campaign/context/UpdateCampaignContext';
import { CampaignPreviewCard } from './campaign-review';
import { CampaignPreview, ECampaignStatus } from '../../../type';
import { formatDistanceToNow } from 'date-fns';
import { useParams } from 'next/navigation';

export function CampaignSidebar() {
  const { form, saveChanges } = useUpdateCampaignContext();
  const params = useParams<{ campaignId: string }>();
  const campaignId = params?.campaignId ? String(params.campaignId) : '';

  const preview: CampaignPreview = {
    name: form.name ?? '',
    shortDescription: form.shortDescription ?? '',
    currentFunding: 0,
    targetFunding: form.fundraisingGoal || 0,
    percentage: 0,
    contributors: 0,
    daysRemaining: `${form.endDate ? formatDistanceToNow(new Date(form.endDate)) : `0 day`} remaining`,
    status: ECampaignStatus.Draft,
  };

  return (
    <aside className="space-y-6">
      <CampaignPreviewCard preview={preview} />

      <Card className="border-border bg-card dark:bg-primary/10 gap-4">
        <CardContent className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={() => campaignId && saveChanges(campaignId)}
            className={cn('bg-brand-primary hover:bg-brand-primary/90 shadow-brand-primary/30 text-white shadow-lg')}
          >
            Save changes
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}
