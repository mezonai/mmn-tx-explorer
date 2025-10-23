import { donationApiClient } from '@/service';
import { IPaginatedResponse } from '@/types';
import { CampaignListParams, CampaignStats, CreateCampaignRequest, DonationCampaign } from './type';
import { DONATION_ENDPOINTS } from './constants';

export class DonationCampaignService {
  static async getStats(): Promise<CampaignStats> {
    const { data } = await donationApiClient.get<{ data: CampaignStats }>(DONATION_ENDPOINTS.STATS);
    return data.data;
  }

  static async getCampaigns(params: CampaignListParams = {}): Promise<IPaginatedResponse<DonationCampaign[]>> {
    const { data } = await donationApiClient.get<IPaginatedResponse<DonationCampaign[]>>(DONATION_ENDPOINTS.CAMPAIGNS, {
      params,
    });
    return data;
  }

  static async getCampaignById(id: string): Promise<DonationCampaign> {
    const { data } = await donationApiClient.get<{ data: DonationCampaign }>(DONATION_ENDPOINTS.CAMPAIGN_BY_ID(id));
    return data.data;
  }

  static async createCampaign(campaignData: CreateCampaignRequest): Promise<DonationCampaign> {
    const { data } = await donationApiClient.post<{ data: DonationCampaign }>(
      DONATION_ENDPOINTS.CAMPAIGNS,
      campaignData
    );
    return data.data;
  }

  static async updateCampaign(id: string, campaignData: Partial<CreateCampaignRequest>): Promise<DonationCampaign> {
    const { data } = await donationApiClient.put<{ data: DonationCampaign }>(
      DONATION_ENDPOINTS.CAMPAIGN_BY_ID(id),
      campaignData
    );
    return data.data;
  }

  static async deleteCampaign(id: string): Promise<void> {
    await donationApiClient.delete(DONATION_ENDPOINTS.CAMPAIGN_BY_ID(id));
  }

  static async getUserDonations(params: { page?: number; limit?: number } = {}) {
    const { data } = await donationApiClient.get(DONATION_ENDPOINTS.MY_DONATIONS, {
      params,
    });
    return data;
  }

  static async makeDonation(donationData: { campaignId: string; amount: number; message?: string }) {
    const { data } = await donationApiClient.post(DONATION_ENDPOINTS.DONATIONS, donationData);
    return data;
  }
}
