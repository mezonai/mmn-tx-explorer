import { BreadcrumbNavigation } from '@/components/shared';
import { IBreadcrumb } from '@/types';
import { CampaignActivity, CampaignHeader, DonationSidebar } from './shared';
import { ROUTES } from '@/configs/routes.config';
import { CampaignDetailProvider } from './provider/campaignProvider';
import { DonationCampaign } from '../../type';
import { Separator } from '@/components/ui/separator';
import { DonationFeed } from './shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

        <div className="z-10 flex flex-col items-center justify-between lg:flex-row">
          <Tabs defaultValue="update" className="w-full gap-0">
            <TabsList className="w-full bg-transparent px-0 pb-0 lg:w-fit dark:bg-transparent">
              <TabsTrigger
                value={'update'}
                className="text-muted-foreground data-[state=active]:border-brand-primary data-[state=active]:text-foreground mr-5 rounded-none border-0 px-0 data-[state=active]:border-b"
              >
                Updates
              </TabsTrigger>
              <TabsTrigger
                value={'community'}
                className="text-muted-foreground data-[state=active]:border-brand-primary data-[state=active]:text-foreground mr-5 rounded-none border-0 px-0 data-[state=active]:border-b"
              >
                Community
              </TabsTrigger>
              <TabsTrigger
                value={'activity'}
                className="text-muted-foreground data-[state=active]:border-brand-primary data-[state=active]:text-foreground mr-5 rounded-none border-0 px-0 data-[state=active]:border-b"
              >
                Fundraising Activity
              </TabsTrigger>
            </TabsList>
            <Separator className="mb-5 bg-gray-200/70 dark:bg-gray-800" />

            <TabsContent value="activity">
              <CampaignActivity campaign={campaign} walletAddress={campaign.donation_wallet} />
            </TabsContent>
            <TabsContent value="update">
              <DonationFeed
                campaign={campaign}
                isOwner={true}
                feedTitle="Updates"
                feedDescription="Follow the full journey of this campaign."
              />
            </TabsContent>
            <TabsContent value="community">
              <DonationFeed
                campaign={campaign}
                isOwner={false}
                feedTitle="Community"
                feedDescription="Join the conversation. Share your thoughts and support for this campaign."
              />
            </TabsContent>
          </Tabs>
        </div>
      </CampaignDetailProvider>
    </div>
  );
};
