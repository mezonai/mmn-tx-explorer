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
  end_date: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  total_contributors: number;
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
  total_campaigns_active: number;
  total_amount: number;
  total_contributors: number;
}
