'use client';

import { UpdateDonationProvider } from '../../context';
import { CreateUpdateContent } from './shared/';
import { DonationCampaign } from '../../type';

interface CreateUpdateProps {
  campaign: DonationCampaign;
}
export const CreateUpdate = ({ campaign }: CreateUpdateProps) => {
  return (
    <UpdateDonationProvider campaign={campaign}>
      <CreateUpdateContent />
    </UpdateDonationProvider>
   
  );
};
