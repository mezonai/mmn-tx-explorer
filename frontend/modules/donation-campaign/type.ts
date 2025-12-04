import { ETransferType } from '@/modules/transaction';

export enum ECampaignStatus {
  Active = 1,
  Draft = 0,
  Closed = 2,
}

export interface DonationCampaign {
  id: string;
  name: string;
  slug: string;
  description: string;
  goal: number;
  url: string;
  donation_wallet: string;
  creator: string;
  status: ECampaignStatus;
  end_date: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  total_contributors: number;
  recent_amount?: number;
  owner: string;
  verified: boolean;
  current_balance: number;
  total_withdrawn: number;
}

export interface CreateCampaignRequest {
  name: string;
  description: string;
  goal: number;
  url: string;
  donation_wallet: string;
  end_date: string;
  owner: string;
}

export interface DonationRequest {
  campaignId: string;
  amount: number;
  currency: string;
  donorName?: string;
  message?: string;
  anonymous?: boolean;
}

export interface DonationResponse {
  success: boolean;
  data: {
    donationId: string;
    transactionHash?: string;
    status: 'pending' | 'completed' | 'failed';
  };
  message: string;
}

export interface CampaignListParams {
  page: number;
  limit: number;
  status?: string;
  verified?: boolean;
  order?: 'asc' | 'desc';
  order_by?: 'total_amount' | 'created_at' | 'end_date' | 'recent_amount';
  search?: string;
}

export interface CampaignStats {
  total_campaigns_active: number;
  total_amount: number;
  total_contributors: number;
}

// Response returned when syncing/refreshing campaign raised totals
// NOTE: refresh/sync endpoints return a small payload with updated totals.
// Those fields already exist on `DonationCampaign` (total_amount/total_contributors/recent_amount)
// so we reuse that type (Partial<DonationCampaign>) where needed instead of creating a new type.

export interface CreateCampaignForm {
  name: string;
  shortDescription: string;
  bannerImageUrl: string;
  fundraisingGoal: number | null;
  endDate: string;
  owner: string;
  fullDescription: string;
  donationWallet: {
    address: string;
    privateKey: string;
  };
}

export interface CampaignPreview {
  name: string;
  shortDescription: string;
  currentFunding: number;
  targetFunding: number;
  percentage: number;
  contributors: number;
  daysRemaining: string;
  status: ECampaignStatus;
}
export interface Transaction {
  chain_id: string;
  hash: string;
  nonce: number;
  block_hash: string;
  block_number: number;
  from_address: string;
  to_address: string;
  value: string;
  transaction_type: number;
  status: number;
  transaction_timestamp: number;
  text_data?: string;
  transaction_extra_info_type: ETransferType;
}
export interface TopContributor {
  sender_wallet: string;
  total_donate: number;
  percentage: number;
}

export interface TopContributorsResponse {
  code: number;
  message: string;
  data: {
    campaign_id: number;
    contributors: TopContributor[];
  };
}
