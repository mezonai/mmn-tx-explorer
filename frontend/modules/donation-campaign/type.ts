export enum CampaignStatus {
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
  wallet: string;
  creator: string;
  status: CampaignStatus;
  // startDate: string;
  end_date: string;
  // createdBy: string;
  created_at: string;
  updated_at: string;
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
