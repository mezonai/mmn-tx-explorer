'use client';
import { CreateCampaignProvider, useCreateCampaignContext } from '../../context/CreateCampaignContext';
import { CampaignSidebar } from './campaign-sidebar';
import { CampaignEditor } from './campaign-editor.tsx';
import { Separator } from '@/components/ui/separator';
import { CampaignForm } from './campaign-form';
import { useParams } from 'next/navigation';
import { useCampaign } from '@/modules/donation-campaign/hooks/useCampaign';
import { useEffect } from 'react';

function EditCampaignContent() {
  const params = useParams<{ campaignId: string }>();
  const id = params?.campaignId ? String(params.campaignId) : '';
  const { data: campaign } = useCampaign(id);
  const { updateField } = useCreateCampaignContext();

  useEffect(() => {
    if (campaign) {
      updateField('name', campaign.name || '');
      updateField('shortDescription', campaign.description || '');
      updateField('bannerImageUrl', campaign.url || '');
      updateField('fundraisingGoal', campaign.goal ?? null);
      updateField('endDate', campaign.end_date || '');
      updateField('owner', campaign.owner || '');
    }
  }, [campaign, updateField]);

  return (
    <div className="space-y-16 pb-16">
      <section className="">
        <CampaignEditor />
      </section>
      <Separator className="bg-gray-200/70 dark:bg-gray-800" />

      <section className="">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <CampaignForm />
          <CampaignSidebar />
        </div>
      </section>
    </div>
  );
}

export const EditCampaign = () => {
  const params = useParams<{ campaignId: string }>();
  const id = params?.campaignId ? String(params.campaignId) : '';
  return (
    <CreateCampaignProvider id={id}>
      <EditCampaignContent />
    </CreateCampaignProvider>
  );
};
