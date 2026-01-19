import { apiDongClient } from '@/service';
import { IPaginatedResponse } from '@/types';
import {
  CampaignListParams,
  CampaignStats,
  CreateCampaignRequest,
  DonationCampaign,
  TopContributorsResponse,
  IDonationFeed,
  DonationFeedParams,
  UploadImageRequest,
  UploadImageResponse,
} from './type';
import { DONATION_ENDPOINTS } from './constants';
import { InternalAxiosRequestConfig } from 'axios';

export class DonationCampaignService {
  static async getStats(): Promise<CampaignStats> {
    const { data } = await apiDongClient.get<{ data: CampaignStats }>(DONATION_ENDPOINTS.STATS, {
      meta: { authOptional: true },
    } as InternalAxiosRequestConfig);
    return data.data;
  }

  static async getCampaigns(params: CampaignListParams): Promise<IPaginatedResponse<DonationCampaign[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<DonationCampaign[]>>(DONATION_ENDPOINTS.CAMPAIGNS, {
      meta: { authOptional: true },
      params,
    } as InternalAxiosRequestConfig);
    return data;
  }

  static async getCampaignById(id: string): Promise<DonationCampaign> {
    const { data } = await apiDongClient.get<{ data: DonationCampaign }>(DONATION_ENDPOINTS.CAMPAIGN_BY_ID(id), {
      meta: { authOptional: true },
    } as InternalAxiosRequestConfig);
    return data.data;
  }

  static async getCampaignBySlug(slug: string): Promise<DonationCampaign> {
    const { data } = await apiDongClient.get<{ data: DonationCampaign }>(DONATION_ENDPOINTS.CAMPAIGN_BY_SLUG(slug), {
      meta: { authOptional: true },
    } as InternalAxiosRequestConfig);
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
      meta: { authOptional: false },
      params,
    } as InternalAxiosRequestConfig);
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
    const { data } = await apiDongClient.get<TopContributorsResponse>(DONATION_ENDPOINTS.TOP_CONTRIBUTOR(campaignId), {
      meta: { authOptional: true },
      params,
    } as InternalAxiosRequestConfig);
    return data.data;
  }

  static async refreshCampaignRaised(id: string): Promise<DonationCampaign> {
    const { data } = await apiDongClient.post<{ data: DonationCampaign }>(
      DONATION_ENDPOINTS.REFRESH_CAMPAIGN_RAISED(id)
    );
    return data.data;
  }

  static async getDonationFeed({
    address,
    params,
  }: {
    address: string;
    params?: DonationFeedParams;
  }): Promise<IPaginatedResponse<IDonationFeed[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<IDonationFeed[]>>(
      DONATION_ENDPOINTS.DONATION_FEED(address),
      { params } as InternalAxiosRequestConfig
    );
    return data;
  }

  static async donationFeedHistory(root_hash: string): Promise<IPaginatedResponse<IDonationFeed[]>> {
    const { data } = await apiDongClient.get<IPaginatedResponse<IDonationFeed[]>>(
      DONATION_ENDPOINTS.DONATION_FEED_HISTORY(root_hash),
      { meta: { authOptional: true } } as InternalAxiosRequestConfig
    );
    return data;
  }

  static async getDonationFeedPostDetail(tx_hash: string): Promise<IDonationFeed> {
    const { data } = await apiDongClient.get<{ data: IDonationFeed }>(
      DONATION_ENDPOINTS.DONATION_FEED_POST_DETAIL(tx_hash),
      { meta: { authOptional: true } } as InternalAxiosRequestConfig
    );
    return data.data;
  }

  static async toggleHideDonationFeed(root_hash: string, visible: boolean): Promise<any> {
    const { data } = await apiDongClient.patch(DONATION_ENDPOINTS.TOGGLE_HIDE_DONATION_FEED(root_hash), {
      visible,
    });
    return data;
  }

  static async uploadDonationImages(imageData: UploadImageRequest): Promise<UploadImageResponse> {
    const formData = new FormData();
    imageData.files.forEach((file) => {
      formData.append('files', file);
    });

    const { data } = await apiDongClient.post<{ data: UploadImageResponse }>(
      DONATION_ENDPOINTS.DONATION_FEED_UPLOAD_IMAGES,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data.data;
  }
}
