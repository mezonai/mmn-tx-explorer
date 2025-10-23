export enum CampaignStatus {
  Active = 'active',
  Draft = 'draft',
  Closed = 'closed',
}

export interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  status: CampaignStatus;
  targetAmount: number;
  currentAmount: number;
  // startDate: string;
  endDate: string;
  // createdBy: string;
  contributors: number;
  lastDonation?: string;
}

export interface CreateCampaignRequest {
  title: string;
  description: string;
  targetAmount: number;
  currency: string;
  endDate: string;
  category: string;
  images?: string[];
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
