import { apiDongClient } from '@/service';
import { IPaginatedResponse } from '@/types';
import {
  CampaignListParams,
  CampaignStats,
  CreateCampaignRequest,
  DonationCampaign,
  TopContributorsResponse,
} from './type';
import { DONATION_ENDPOINTS } from './constants';

export class DonationCampaignService {
  static async getStats(): Promise<CampaignStats> {
    const { data } = await apiDongClient.get<{ data: CampaignStats }>(DONATION_ENDPOINTS.STATS);
    return data.data;
  }

  static async getCampaigns(params: CampaignListParams): Promise<IPaginatedResponse<DonationCampaign[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<DonationCampaign[]>>(DONATION_ENDPOINTS.CAMPAIGNS, {
      params,
    });
    return data;
  }

  static async getCampaignById(id: string): Promise<DonationCampaign> {
    const { data } = await apiDongClient.get<{ data: DonationCampaign }>(DONATION_ENDPOINTS.CAMPAIGN_BY_ID(id));
    return data.data;
  }

  static async getCampaignBySlug(slug: string): Promise<DonationCampaign> {
    const { data } = await apiDongClient.get<{ data: DonationCampaign }>(DONATION_ENDPOINTS.CAMPAIGN_BY_SLUG(slug));
    return data.data;
  }

  static async createCampaign(campaignData: CreateCampaignRequest): Promise<DonationCampaign> {
    const { data } = await apiDongClient.post<{ data: DonationCampaign }>(
      DONATION_ENDPOINTS.CREATE_CAMPAIGN,
      campaignData
    );
    return data.data;
  }

  static async publishCampaign(id: string): Promise<DonationCampaign> {
    const { data } = await apiDongClient.patch<{ data: DonationCampaign }>(DONATION_ENDPOINTS.PUBLISH_CAMPAIGN(id));
    return data.data;
  }

  static async createAndPublishCampaign(campaignData: CreateCampaignRequest): Promise<DonationCampaign> {
    const { data } = await apiDongClient.post<{ data: DonationCampaign }>(
      DONATION_ENDPOINTS.CREATE_AND_PUBLISH_CAMPAIGN,
      campaignData
    );
    return data.data;
  }

  static async editCampaign(id: string, campaignData: Partial<CreateCampaignRequest>): Promise<DonationCampaign> {
    const { data } = await apiDongClient.put<{ data: DonationCampaign }>(
      DONATION_ENDPOINTS.EDIT_CAMPAIGN(id),
      campaignData
    );
    return data.data;
  }

  static async deleteCampaign(id: string): Promise<void> {
    await apiDongClient.delete(DONATION_ENDPOINTS.DELETE_CAMPAIGN(id));
  }

  static async getUserDonations(params: { page?: number; limit?: number } = {}) {
    const { data } = await apiDongClient.get(DONATION_ENDPOINTS.MY_DONATIONS, {
      params,
    });
    return data;
  }

  static async closeCampaign(id: string): Promise<any> {
    const { data } = await apiDongClient.patch(DONATION_ENDPOINTS.CLOSE_CAMPAIGN(id));
    return data;
  }

  static async activateCampaign(id: string): Promise<any> {
    const { data } = await apiDongClient.patch(DONATION_ENDPOINTS.ACTIVATE_CAMPAIGN(id));
    return data;
  }

  static async getTopContributor({
    campaignId,
    params,
  }: {
    campaignId: string;
    params: { limit: number };
  }): Promise<TopContributorsResponse['data']> {
    await this.refreshCampaignRaised(campaignId);
    const { data } = await apiDongClient.get<TopContributorsResponse>(DONATION_ENDPOINTS.TOP_CONTRIBUTOR(campaignId), {
      params,
    });
    return data.data;
  }

  static async refreshCampaignRaised(id: string): Promise<DonationCampaign> {
    const { data } = await apiDongClient.post<{ data: DonationCampaign }>(
      DONATION_ENDPOINTS.REFRESH_CAMPAIGN_RAISED(id)
    );
    return data.data;
  }
}
