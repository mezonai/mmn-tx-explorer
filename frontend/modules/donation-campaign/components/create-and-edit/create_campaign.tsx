'use client';

import { CreateCampaignProvider } from '../../context/CreateCampaignContext';
import { CampaignSidebar } from './campaign-sidebar';
import { CampaignHeader } from './campaign-header';
import { Separator } from '@/components/ui/separator';
import { CampaignForm } from './campaign-form';

interface CreateCampaignProps {
  id?: string;
}

function CreateCampaignContent() {
  return (
    <div className="space-y-16 pb-16">
      <section className="">
        <CampaignHeader />
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

export const CreateCampaign = ({ id }: CreateCampaignProps) => {
  return (
    <CreateCampaignProvider id={id}>
      <CreateCampaignContent />
    </CreateCampaignProvider>
  );
};
