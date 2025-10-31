'use client';
import { UpdateCampaignProvider, useUpdateCampaignContext } from '../../context/UpdateCampaignContext';
import { CampaignSidebar } from './campaign-sidebar';
import { CampaignEditor } from './campaign-editor.tsx';
import { Separator } from '@/components/ui/separator';
import { CampaignForm } from './campaign-form';
import { useParams } from 'next/navigation';
import { useCampaign } from '@/modules/donation-campaign/hooks/useCampaign';
import { useEffect } from 'react';

function UpdateCampaignContent() {
  const params = useParams<{ campaignId: string }>();
  const id = params?.campaignId ? String(params.campaignId) : '';
  const { data: campaign } = useCampaign(id);
  const { setForm } = useUpdateCampaignContext();

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name || '',
        shortDescription: campaign.description || '',
        bannerImageUrl: campaign.url || '',
        fundraisingGoal: campaign.goal ?? null,
        endDate: campaign.end_date || '',
        owner: campaign.owner || '',
      });
    }
  }, [campaign, setForm]);

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

export const UpdateCampaign = () => {
  return (
    <UpdateCampaignProvider>
      <UpdateCampaignContent />
    </UpdateCampaignProvider>
  );
};
