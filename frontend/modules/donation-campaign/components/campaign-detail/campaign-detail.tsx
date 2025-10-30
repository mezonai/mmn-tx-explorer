import { BreadcrumbNavigation } from '@/components/shared';
import { DonationCampaignService } from '../../api';
import { IBreadcrumb } from '@/types';
import { CampaignActivity, CampaignHeader, DonationSidebar } from './shared';
import { ROUTES } from '@/configs/routes.config';
import { CampaignDetailProvider } from './provider/campaignProvider';
import { DonationCampaign } from '../../type';

interface CampaignDetailProps {
  campaign: DonationCampaign;
}
const breadcrumbs: IBreadcrumb[] = [
  { label: 'Donation campaign', href: ROUTES.DONATION_CAMPAIGN },
  { label: 'Campaign Details', href: '#' },
] as const;

export const CampaignDetail = async ({ campaign }: CampaignDetailProps) => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
      </div>
      <CampaignDetailProvider>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <CampaignHeader campaign={campaign} />
          </div>
          <div>
            <DonationSidebar campaign={campaign} />
          </div>
        </div>
        <CampaignActivity campaignId={campaign.id} walletAddress={campaign.donation_wallet} />
      </CampaignDetailProvider>
    </div>
  );
};
