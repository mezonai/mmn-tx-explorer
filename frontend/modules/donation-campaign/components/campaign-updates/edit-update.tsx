'use client';

import { UpdateDonationProvider } from '../../context';
import { EditUpdateContent } from './shared/edit-update-content';
import { DonationCampaign, IDonationFeed } from '../../type';

interface EditUpdateProps {
  campaign: DonationCampaign;
  updatePost: IDonationFeed;
}
export const EditUpdate = ({ campaign, updatePost }: EditUpdateProps) => {
  return (
    <UpdateDonationProvider campaign={campaign} updatePost={updatePost}>
      <EditUpdateContent updatePost={updatePost} />
    </UpdateDonationProvider>
  );
};
