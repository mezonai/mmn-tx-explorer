export enum ECampaignStatus {
  Active = 1,
  Draft = 0,
  Closed = 2,
}

export interface DonationCampaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  url: string;
  donation_wallet: string;
  creator: string;
  status: ECampaignStatus;
  end_date: string;
  created_at: string;
  updated_at: string;
  total_amount: number | 0;
  total_contributors: number | 0;
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
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  sortBy?: 'newest' | 'oldest' | 'amount' | 'progress';
  search?: string;
}

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRaised: number;
  totalContributors: number;
  completedCampaigns: number;
}

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
