import { BreadcrumbNavigation } from '@/components/shared';
import { IBreadcrumb } from '@/types';
import { DonationSidebar } from './shared/donation-sidebar';
import { CampaignActivity } from './shared/campaign-activity';
import { CampaignHeader } from './shared/campaign-header';
import { CampaignExtras } from './shared/campaign-extras';
import { DonationCampaignService } from '../../api';

interface CampaignDetailProps {
  campaignId: string;
}
const breadcrumbs: IBreadcrumb[] = [
  { label: 'Donation campaign', href: '/donation-campaign' },
  { label: 'Campaign Details', href: '#' },
] as const;
const campaign = {
  created_at: '2025-12-24T08:55:12Z',
  creator: '1946198449917530112',
  description:
    'Provide insulated jackets, gloves, and heaters for 800 students living in remote northern mountains ahead of winter.',
  wallet: '9PPsJBJpVYAKYVzxfCgH3HRkvGfw4sTvEF5dzq5jc1tX',
  end_date: '2025-12-31T23:59:59Z',
  goal: 1000000,
  id: '3',
  name: 'Warm Clothes for Highland Kids',
  status: 2,
  total_amount: 250000,
  total_contributors: 42,
  updated_at: '2025-10-24T08:55:40Z',
  url: 'http://88/swa',
};

const mockCampaign = {
  id: '1',
  title: 'Hope for Tomorrow: Building Futures for Children',
  description:
    'Support our mission to provide education, healthcare, and brighter futures for children in undeserved communities across Southeast Asia.',
  status: 'Active campaign',
  image: '/images/campaign-hero.jpg',

  raised: 35420,
  goal: 50000,
  contributors: 128,
  daysRemaining: 12,

  owner: {
    name: 'Mezon Foundation',
    wallet: '0x9a8b...de3f',
    verified: true,
  },

  walletAddress: '0xD12Bf918A6A98F12a4C8eB19aAD27BfD87aF1D4e',
  qrCodeUrl: '/images/qr-code-placeholder.png', // ảnh QR code giả

  recentActivity: [
    {
      sender: '0x9A3f...B7E1',
      amount: 120,
      timestamp: '2025-10-21T14:32:00Z',
      txHash: '0x8d3f...7aE2',
      source: 'MetaMask',
    },
    {
      sender: '0xB2F9...C92D',
      amount: 300,
      timestamp: '2025-10-22T09:18:00Z',
      txHash: '0x93f1...9b3a',
      source: 'WalletConnect',
    },
    {
      sender: '0xC81A...9EE3',
      amount: 75,
      timestamp: '2025-10-23T02:45:00Z',
      txHash: '0xA3f7...0dE2',
      source: 'MetaMask',
    },
  ],

  topContributors: [
    { wallet: '0xAAE2...F93D', amount: 2500, percentage: 25 },
    { wallet: '0xC44F...B871', amount: 1900, percentage: 19 },
    { wallet: '0xD27E...C091', amount: 1250, percentage: 12.5 },
    { wallet: '0xEE8C...A52B', amount: 1100, percentage: 11 },
    { wallet: '0xF19D...DE32', amount: 800, percentage: 8 },
  ],

  about: `
  Our campaign focuses on supporting children in rural areas through direct financial aid, school supplies, and health programs. 
  Every donation helps create sustainable impact and empowers future generations.
  `,

  impact: [
    {
      text: 'Your donations have supported 320+ children, built 3 classrooms, and funded over 100 healthcare check-ups.',
      image: '/images/impact-photo.jpg',
    },
  ],

  contact: {
    email: 'contact@mezonfoundation.org',
    phone: '+84 912 345 678',
    address: '123 Hope Street, Ho Chi Minh City, Vietnam',
  },
};

export const CampaignDetail = async ({ campaignId }: CampaignDetailProps) => {
  // const campaignDetail = await DonationCampaignService.getCampaignById(campaignId);
  // console.log(campaignDetail);
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <CampaignHeader campaign={campaign} />
        </div>
        <div>
          <DonationSidebar campaign={campaign} />
        </div>
      </div>
      <CampaignActivity campaign={mockCampaign} />
      <CampaignExtras campaign={mockCampaign} />
    </div>
  );
};
