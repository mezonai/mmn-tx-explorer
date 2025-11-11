'use client';

import { useCreateCampaignContext } from '../../../context/CreateCampaignContext';
import { CampaignPreviewCard } from './campaign-preview';
import { PrePublishChecklist } from './pre-publish-checklist';
import { CampaignPreview, ECampaignStatus, DonationCampaign } from '../../../type';
import { useMemo } from 'react';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { CampaignActions } from './campaign-actions';
import { CampaignModeProps } from '../types';

interface CampaignSidebarProps extends CampaignModeProps {
  campaign?: DonationCampaign;
}

export function CampaignSidebar({ type = 'create', campaign }: CampaignSidebarProps) {
  const { form, validation } = useCreateCampaignContext();

  // Calculate preview data
  const preview: CampaignPreview = {
    name: form.name,
    shortDescription: form.shortDescription,
    currentFunding: NumberUtil.scaleDown(campaign?.total_amount || 0),
    targetFunding: form.fundraisingGoal || 0,
    percentage:
      form.fundraisingGoal && form.fundraisingGoal > 0
        ? parseFloat(((NumberUtil.scaleDown(campaign?.total_amount || 0) / form.fundraisingGoal) * 100).toFixed(2))
        : 100,
    contributors: 0,
    daysRemaining: form.endDate ? `${DateTimeUtil.safeFormatDistanceToNow(new Date(form.endDate))} remaining` : ``,
    status: type === 'edit' && campaign ? campaign.status : ECampaignStatus.Draft,
  };

  // Checklist items based on validation
  const checklistItems = useMemo(
    () => [
      {
        id: 1,
        text: 'Complete the name, short description, and banner visual.',
        completed: validation.isBasicsComplete,
      },
      {
        id: 2,
        text: 'Define fundraising goal, end date, and campaign stakeholders.',
        completed: validation.isGoalsComplete,
      },
      {
        id: 3,
        text: 'Generate the wallet and store the private key securely offline.',
        completed: validation.isWalletComplete,
      },
      {
        id: 4,
        text: 'Proof the About content, contact info, and external links.',
        completed: validation.isDescriptionComplete,
      },
    ],
    [validation]
  );

  return (
    <aside className="space-y-6">
      <CampaignPreviewCard preview={preview} />
      {type === 'create' && <PrePublishChecklist items={checklistItems} />}
      <CampaignActions type={type} />
    </aside>
  );
}
