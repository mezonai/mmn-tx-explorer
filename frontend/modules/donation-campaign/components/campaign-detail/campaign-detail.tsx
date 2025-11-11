import { BreadcrumbNavigation } from '@/components/shared';
import { IBreadcrumb } from '@/types';
import { CampaignActivity, CampaignHeader, DonationSidebar } from './shared';
import { ROUTES } from '@/configs/routes.config';
import { CampaignDetailProvider } from './provider/campaignProvider';
import { DonationCampaign } from '../../type';
import { APP_CONFIG } from '@/configs/app.config';
import { Separator } from '@/components/ui/separator';

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

        <Separator className="my-16 bg-gray-200/70 dark:bg-gray-800" />

        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fundraising activity</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Live events streaming directly from the {APP_CONFIG.CHAIN_SYMBOL} chain with full transparency.
          </p>
        </div>

        <CampaignActivity campaignId={campaign.id} walletAddress={campaign.donation_wallet} />
      </CampaignDetailProvider>
    </div>
  );
};
