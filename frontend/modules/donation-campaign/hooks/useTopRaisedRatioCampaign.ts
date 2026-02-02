import { useMemo } from 'react';
import { useTopCampaigns } from './useTopCampaigns';
import { ECampaignStatus, type CampaignListParams, type DonationCampaign } from '../type';
import { NumberUtil } from '@/utils';
import { ESortOrder } from '@/enums/sort.enum';

export type TopRaisedRatio = {
  campaign: DonationCampaign | null;
  ratio: number;
};

const DEFAULT_PARAMS: CampaignListParams = {
  page: 1,
  limit: 1,
  verified: true,
  status: String(ECampaignStatus.Active),
  order: ESortOrder.DESC,
  order_by: 'total_amount',
};

export const useTopRaisedRatioCampaign = (params?: Partial<CampaignListParams>) => {
  const mergedParams: CampaignListParams = { ...DEFAULT_PARAMS, ...params };

  const { campaigns, isLoading, error } = useTopCampaigns(mergedParams);

  const top = useMemo<TopRaisedRatio>(() => {
    if (!campaigns?.length) {
      return { campaign: null, ratio: 0 };
    }

    const [campaign] = campaigns;
    const raised = NumberUtil.scaleDown(campaign.total_amount);
    const ratio = campaign.goal > 0 ? raised / campaign.goal : 0;

    return { campaign, ratio: Math.max(0, ratio) };
  }, [campaigns]);

  const clampedPercentage = Math.min(100, Math.max(0, top.ratio * 100));
  const percentageDisplay = clampedPercentage.toFixed(2);
  const barPercentage = parseFloat(percentageDisplay);
  const percentage = Math.round(clampedPercentage);

  return {
    campaign: top.campaign,
    ratio: top.ratio,
    percentageDisplay,
    barPercentage,
    percentage,
    isLoading,
    error,
  };
};
