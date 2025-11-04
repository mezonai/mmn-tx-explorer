'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCreateCampaignContext } from '@/modules/donation-campaign/context/CreateCampaignContext';
import { CampaignPreviewCard } from './campaign-review';
import { CampaignPreview, ECampaignStatus } from '../../../type';
import { formatDistanceToNow } from 'date-fns';
import { useParams } from 'next/navigation';
import { CampaignActions } from './campaign-actions';

export function CampaignSidebar() {
  const { form, handleSubmit } = useCreateCampaignContext();
  const params = useParams<{ campaignId: string }>();

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
      <CampaignActions />
    </aside>
  );
}
